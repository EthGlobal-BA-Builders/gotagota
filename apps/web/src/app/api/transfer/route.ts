import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const PROVIDER_URL = "https://alfajores-forno.celo-testnet.org";
const PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!; 
const CONTRACT_ADDRESS = process.env.VAULT_ADDRESS!;

const ABI = [
    "function gaslessTransfer(address user, address to, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user, to, amount, nonce, deadline, signature } = body;

        // Setup Provider y Wallet 
        const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const vaultContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

        console.log(`Processing transfer for ${user}`);

        // Deconstruct the signature
        const sig = ethers.Signature.from(signature);

        // Send Transaction
        const tx = await vaultContract.gaslessTransfer(
            user, 
            to, 
            amount, 
            deadline,
            sig.v, 
            sig.r, 
            sig.s
        );

        // Wait for confirmation 
        await tx.wait(); 

        // Return success response
        return NextResponse.json({ success: true, txHash: tx.hash });

    } catch (error: any) {
        console.error("Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}