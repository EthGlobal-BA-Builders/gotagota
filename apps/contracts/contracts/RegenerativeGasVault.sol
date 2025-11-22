// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IStakedCelo
/// @notice Interface for the StakedCelo (stCELO) liquid staking protocol
interface IStakedCelo {
    /// @notice Deposits CELO and mints stCELO to the caller
    function deposit() external payable;
    
    /// @notice Withdraws CELO by burning stCELO
    /// @param stCeloAmount Amount of stCELO to burn
    function withdraw(uint256 stCeloAmount) external;
    
    /// @notice Converts CELO amount to stCELO amount at current rate
    /// @param celoAmount Amount of CELO
    /// @return stCELO amount
    function toStakedCelo(uint256 celoAmount) external view returns (uint256);
    
    /// @notice Converts stCELO amount to CELO amount at current rate
    /// @param stCeloAmount Amount of stCELO
    /// @return CELO amount
    function toCelo(uint256 stCeloAmount) external view returns (uint256);
}

/// @title IERC20
/// @notice Minimal ERC20 interface for stCELO token
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title RegenerativeGasVault
/// @notice Vault in CELO that uses yield to pay gas for gasless transfers
contract RegenerativeGasVault {
    // --- Roles ---

    address public owner;
    address public relayer; // authorized address to send meta-txs onchain

    // --- Staking Integration ---

    IStakedCelo public immutable stakedCelo;
    IERC20 public immutable stCeloToken;

    // --- Main State ---

    // Deposits in 1:1 CELO units
    mapping(address => uint256) public deposits;

    // Sum of all user deposits (principal)
    uint256 public totalDeposits;

    // Fund designated to pay gas (in CELO)
    uint256 public gasFund;

    // Nonces per user to prevent replay in meta-tx
    mapping(address => uint256) public nonces;

    // --- Simple reentrancy security ---

    bool private locked;

    modifier nonReentrant() {
        require(!locked, "reentrancy");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "not relayer");
        _;
    }

    // --- Events ---

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event GaslessTransfer(
        address indexed user,
        address indexed to,
        uint256 amount,
        uint256 nonce
    );
    event GasFundUpdated(uint256 newGasFund);
    event GasSubsidized(address indexed relayer, uint256 amount);
    event RelayerUpdated(address indexed newRelayer);
    event YieldCaptured(uint256 yieldAmount, uint256 newGasFund);
    event Staked(uint256 celoAmount, uint256 stCeloReceived);
    event Unstaked(uint256 stCeloAmount, uint256 celoReceived);

    constructor(address _relayer, address _stakedCelo) {
        owner = msg.sender;
        relayer = _relayer;
        stakedCelo = IStakedCelo(_stakedCelo);
        stCeloToken = IERC20(_stakedCelo);
    }

    // --- Fallbacks to receive CELO (in case of staking or extra funds) ---

    receive() external payable {}
    fallback() external payable {}

    // --- Relayer management ---

    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
        emit RelayerUpdated(_relayer);
    }

    // --- Total holdings view ---

    /// @notice Returns the total CELO "controlled" by the vault.
    /// @dev Includes liquid CELO balance + CELO value of stCELO holdings
    function totalHoldings() public view returns (uint256) {
        uint256 liquidCelo = address(this).balance;
        uint256 stakedCeloBalance = stCeloToken.balanceOf(address(this));
        uint256 stakedCeloValue = stakedCelo.toCelo(stakedCeloBalance);
        return liquidCelo + stakedCeloValue;
    }

    // --- Deposit ---

    /// @notice User deposits CELO in the vault.
    /// @dev In v1, everything that enters counts as principal and can go to staking.
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "amount should be greater than 0");

        // Before touching totalDeposits/gasFund, we capture pending yield
        _updateYieldInternal();

        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;

        // Stake deposited CELO into stCELO for yield generation
        _stake(msg.value);

        emit Deposited(msg.sender, msg.value);
    }

    // --- Withdraw (user pays gas) ---

    /// @notice User withdraws part or all of their deposit. Pays normal gas.
    /// @dev In v1 we assume there is sufficient liquidity in the vault to pay.
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "amount should be greater than 0");
        require(deposits[msg.sender] >= amount, "insufficient deposit");

        // Before touching totalDeposits/gasFund, we capture pending yield
        _updateYieldInternal();

        deposits[msg.sender] -= amount;
        totalDeposits -= amount;

        // As the funds are staked, we need to unstake them first
        _unstake(amount);

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // --- Yield capture towards the Gas Fund ---

    /// @notice Calculates if there is "surplus" above totalDeposits + gasFund and sends it to gasFund.
    /// @dev This models the yield: any additional CELO controlled by the contract
    ///      is considered yield and is allocated to the Gas Fund.
    function updateYield() external nonReentrant {
        _updateYieldInternal();
    }

    function _updateYieldInternal() internal {
        uint256 holdings = totalHoldings();

        // What is not principal nor gasFund is considered new yield
        // If holdings < totalDeposits + gasFund, we assume there is no new yield
        if (holdings > totalDeposits + gasFund) {
            uint256 yieldAmount = holdings - totalDeposits - gasFund;
            gasFund += yieldAmount;
            emit YieldCaptured(yieldAmount, gasFund);
            emit GasFundUpdated(gasFund);
        }
    }

    // --- Gasless: gas subsidy to the relayer ---

    /// @notice The relayer recovers CELO from the gasFund to cover gas costs.
    /// @dev In v1, the relayer calculates off-chain how much gas it spent and charges in batches.
    /// @dev Lazily captures yield when called to ensure gasFund is up to date
    function subsidizeGas(uint256 amount) external onlyRelayer nonReentrant {
        require(amount > 0, "amount should be greater than 0");
        require(amount <= gasFund, "not enough gasFund");

        // Before touching gasFund, we capture pending yield
        _updateYieldInternal();

        require(amount <= gasFund, "not enough gasFund after yield");

        gasFund -= amount;

        (bool ok, ) = relayer.call{value: amount}("");
        require(ok, "transfer to relayer failed");

        emit GasSubsidized(relayer, amount);
        emit GasFundUpdated(gasFund);
    }

    // --- Gasless Transfer (meta-tx) ---

    /// @notice Gasless transfer: the user signs a message off-chain and the relayer executes.
    /// @param user Address of the user authorizing the transfer.
    /// @param to Recipient.
    /// @param amount Amount in CELO (in 1e18 units).
    /// @param deadline Maximum timestamp until which the signature is valid.
    /// @param v,r,s Components of the user's signature (EIP-191 / signMessage).
    function gaslessTransfer(
        address user,
        address to,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyRelayer nonReentrant {
        require(amount > 0, "amount should be greater than 0");
        require(block.timestamp <= deadline, "signature expired");
        require(deposits[user] >= amount, "insufficient user deposit");

        // Before touching balances, we capture pending yield
        _updateYieldInternal();

        uint256 userNonce = nonces[user];

        // We construct the message the user should have signed
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "GaslessTransfer(address user,address to,uint256 amount,uint256 nonce,uint256 deadline,address vault)"
                ),
                user,
                to,
                amount,
                userNonce,
                deadline,
                address(this)
            )
        );

        // EIP-191: "\x19Ethereum Signed Message:\n32" + hash
        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", structHash)
        );

        address signer = ecrecover(digest, v, r, s);
        require(signer != address(0), "invalid signature");
        require(signer == user, "unauthorized");

        // Consume nonce (prevents replay)
        nonces[user] = userNonce + 1;

        // Update user deposit
        deposits[user] -= amount;
        totalDeposits -= amount;

        // As the funds are staked, here we need to unstake
        _unstake(amount);

        // Transfer CELO to the recipient
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");

        emit GaslessTransfer(user, to, amount, userNonce);
    }

    // --- Auxiliary getters for the frontend ---

    /// @notice Returns the hash that the user must sign for a gaslessTransfer,
    ///         given the current state (nonce included).
    function getGaslessTransferMessageHash(
        address user,
        address to,
        uint256 amount,
        uint256 deadline
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "GaslessTransfer(address user,address to,uint256 amount,uint256 nonce,uint256 deadline,address vault)"
                ),
                user,
                to,
                amount,
                nonces[user],
                deadline,
                address(this)
            )
        );

        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", structHash)
        );
    }

    // --- Internal Staking Functions ---

    /// @notice Stakes CELO into stCELO protocol for yield generation
    /// @param amount Amount of CELO to stake
    function _stake(uint256 amount) internal {
        if (amount == 0) return;
        
        uint256 stCeloBalanceBefore = stCeloToken.balanceOf(address(this));
        
        // Deposit CELO and receive stCELO tokens
        stakedCelo.deposit{value: amount}();
        
        uint256 stCeloBalanceAfter = stCeloToken.balanceOf(address(this));
        uint256 stCeloReceived = stCeloBalanceAfter - stCeloBalanceBefore;
        
        emit Staked(amount, stCeloReceived);
    }

    /// @notice Unstakes CELO from stCELO protocol
    /// @param celoAmount Amount of CELO needed (will calculate equivalent stCELO to burn)
    function _unstake(uint256 celoAmount) internal {
        if (celoAmount == 0) return;
        
        // Check if we have enough liquid CELO already
        uint256 liquidCelo = address(this).balance;
        if (liquidCelo >= celoAmount) {
            // No need to unstake, we have enough liquid CELO
            return;
        }
        
        // Calculate how much more CELO we need to unstake
        uint256 celoNeeded = celoAmount - liquidCelo;
        
        // Convert CELO amount to stCELO amount at current exchange rate
        uint256 stCeloAmount = stakedCelo.toStakedCelo(celoNeeded);
        
        // Ensure we have enough stCELO to burn
        uint256 stCeloBalance = stCeloToken.balanceOf(address(this));
        require(stCeloBalance >= stCeloAmount, "insufficient stCELO balance");
        
        // Withdraw CELO by burning stCELO
        stakedCelo.withdraw(stCeloAmount);
        
        emit Unstaked(stCeloAmount, celoNeeded);
    }
}
