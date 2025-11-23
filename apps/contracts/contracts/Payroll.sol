// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Payroll {
    using SafeERC20 for IERC20;

    // cUSD token address on Celo (mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a)
    // For testnet, use the testnet cUSD address
    IERC20 public immutable cUSD;

    struct PayrollData {
        address employer;
        uint256 paymentDay; // Day of month (1-31)
        uint256 months; // Number of months the payroll will run
        uint256 startMonth; // Start month (1-12)
        uint256 startYear; // Start year (e.g., 2024)
        uint256 totalAmount; // Total amount for all months
        uint256 createdAt;
        bool active;
    }

    struct EmployeePayment {
        address employee;
        uint256 monthlyAmount; // Amount per month
        uint256 totalMonths; // Total number of months
    }

    // Mapping from payroll ID to payroll data
    mapping(uint256 => PayrollData) public payrolls;
    
    // Mapping from payroll ID to employee address to payment data
    mapping(uint256 => mapping(address => EmployeePayment)) public employeePayments;
    
    // Mapping from payroll ID to array of employee addresses
    mapping(uint256 => address[]) public payrollEmployees;
    
    // Mapping from payroll ID => employee address => month => year => claimed
    // Tracks if a specific month/year has been claimed
    mapping(uint256 => mapping(address => mapping(uint256 => mapping(uint256 => bool)))) public monthlyClaims;
    
    // Counter for payroll IDs
    uint256 public payrollCounter;

    // Events
    event PayrollCreated(
        uint256 indexed payrollId,
        address indexed employer,
        uint256 paymentDay,
        uint256 months,
        uint256 totalAmount,
        address[] employees
    );
    
    event PayrollClaimed(
        uint256 indexed payrollId,
        address indexed employee,
        uint256 month,
        uint256 year,
        uint256 amount
    );
    
    event FundsDeposited(
        uint256 indexed payrollId,
        address indexed employer,
        uint256 amount
    );

    constructor(address _cUSD) {
        require(_cUSD != address(0), "Invalid cUSD address");
        cUSD = IERC20(_cUSD);
    }

    /**
     * @dev Setup a new payroll
     * @param paymentDay Day of month when payroll becomes claimable (1-31)
     * @param months Number of months the payroll will run
     * @param employees Array of employee addresses
     * @param monthlyAmounts Array of monthly amounts for each employee (in cUSD, with 18 decimals)
     */
    function setupPayroll(
        uint256 paymentDay,
        uint256 months,
        address[] calldata employees,
        uint256[] calldata monthlyAmounts
    ) external returns (uint256) {
        require(paymentDay >= 1 && paymentDay <= 31, "Invalid payment day");
        require(months > 0 && months <= 60, "Invalid months (1-60)");
        require(employees.length == monthlyAmounts.length, "Arrays length mismatch");
        require(employees.length > 0, "No employees provided");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < monthlyAmounts.length; i++) {
            require(employees[i] != address(0), "Invalid employee address");
            require(monthlyAmounts[i] > 0, "Amount must be greater than 0");
            totalAmount += monthlyAmounts[i] * months; // Total for all months
        }

        uint256 payrollId = payrollCounter++;
        
        (uint256 startMonth, uint256 startYear) = getCurrentMonthYear();
        
        payrolls[payrollId] = PayrollData({
            employer: msg.sender,
            paymentDay: paymentDay,
            months: months,
            startMonth: startMonth,
            startYear: startYear,
            totalAmount: totalAmount,
            createdAt: block.timestamp,
            active: true
        });

        // Store employee payments
        for (uint256 i = 0; i < employees.length; i++) {
            employeePayments[payrollId][employees[i]] = EmployeePayment({
                employee: employees[i],
                monthlyAmount: monthlyAmounts[i],
                totalMonths: months
            });
            payrollEmployees[payrollId].push(employees[i]);
        }

        emit PayrollCreated(payrollId, msg.sender, paymentDay, months, totalAmount, employees);

        return payrollId;
    }

    /**
     * @dev Deposit funds for a payroll
     * @param payrollId The payroll ID
     * @param amount The amount to deposit (must match totalAmount)
     */
    function depositFunds(uint256 payrollId, uint256 amount) external {
        PayrollData storage payroll = payrolls[payrollId];
        require(payroll.employer == msg.sender, "Not the employer");
        require(payroll.active, "Payroll not active");
        require(amount == payroll.totalAmount, "Amount mismatch");

        cUSD.safeTransferFrom(msg.sender, address(this), amount);

        emit FundsDeposited(payrollId, msg.sender, amount);
    }

    /**
     * @dev Check if a specific month is claimable
     * @param payrollId The payroll ID
     * @param month The month to check (1-12)
     * @param year The year to check
     */
    function isMonthClaimable(uint256 payrollId, uint256 month, uint256 year) public view returns (bool) {
        PayrollData memory payroll = payrolls[payrollId];
        if (!payroll.active) return false;

        // Check if the month is within the payroll period
        uint256 monthsElapsed = getMonthsElapsed(payroll.startMonth, payroll.startYear, month, year);
        if (monthsElapsed >= payroll.months) return false;
        if (month < payroll.startMonth && year == payroll.startYear) return false;

        // Get current day of month
        uint256 currentDay = getDayOfMonth(block.timestamp);
        (uint256 currentMonth, uint256 currentYear) = getCurrentMonthYear();
        
        // Can claim if:
        // 1. The payment day has passed for this month/year, OR
        // 2. It's a previous month/year that hasn't been claimed yet
        if (year < currentYear || (year == currentYear && month < currentMonth)) {
            // Previous month - can claim if not already claimed
            return !monthlyClaims[payrollId][msg.sender][month][year];
        } else if (year == currentYear && month == currentMonth) {
            // Current month - can claim if payment day has passed
            return currentDay >= payroll.paymentDay && !monthlyClaims[payrollId][msg.sender][month][year];
        }
        
        return false;
    }

    /**
     * @dev Claim payroll for a specific month
     * @param payrollId The payroll ID
     * @param month The month to claim (1-12)
     * @param year The year to claim
     */
    function claimPayroll(uint256 payrollId, uint256 month, uint256 year) external {
        require(isMonthClaimable(payrollId, month, year), "Month not claimable");

        EmployeePayment memory payment = employeePayments[payrollId][msg.sender];
        require(payment.employee == msg.sender, "Not eligible for this payroll");
        require(payment.monthlyAmount > 0, "No amount to claim");
        require(!monthlyClaims[payrollId][msg.sender][month][year], "Already claimed this month");

        // Mark as claimed
        monthlyClaims[payrollId][msg.sender][month][year] = true;

        // Transfer the monthly amount
        cUSD.safeTransfer(msg.sender, payment.monthlyAmount);

        emit PayrollClaimed(payrollId, msg.sender, month, year, payment.monthlyAmount);
    }

    /**
     * @dev Check claimable amount for an employee for a specific month
     * @param payrollId The payroll ID
     * @param employee The employee address
     * @param month The month to check (1-12)
     * @param year The year to check
     */
    function checkBalance(uint256 payrollId, address employee, uint256 month, uint256 year) external view returns (uint256) {
        EmployeePayment memory payment = employeePayments[payrollId][employee];
        if (payment.monthlyAmount == 0) return 0;
        if (!isMonthClaimable(payrollId, month, year)) return 0;
        if (monthlyClaims[payrollId][employee][month][year]) return 0;
        return payment.monthlyAmount;
    }

    /**
     * @dev Get all unclaimed months for an employee
     * @param payrollId The payroll ID
     * @param employee The employee address
     */
    function getUnclaimedMonths(uint256 payrollId, address employee) external view returns (uint256[] memory, uint256[] memory) {
        PayrollData memory payroll = payrolls[payrollId];
        EmployeePayment memory payment = employeePayments[payrollId][employee];
        
        if (payment.monthlyAmount == 0) {
            return (new uint256[](0), new uint256[](0));
        }

        uint256[] memory unclaimedMonths = new uint256[](payroll.months);
        uint256[] memory unclaimedYears = new uint256[](payroll.months);
        uint256 count = 0;
        
        for (uint256 i = 0; i < payroll.months; i++) {
            uint256 month = payroll.startMonth;
            uint256 year = payroll.startYear;
            
            // Calculate the month/year for this iteration
            month += i;
            while (month > 12) {
                month -= 12;
                year += 1;
            }
            
            // Check if this month is claimable and not claimed
            if (isMonthClaimableForEmployee(payrollId, employee, month, year, payroll)) {
                unclaimedMonths[count] = month;
                unclaimedYears[count] = year;
                count++;
            }
        }

        // Resize arrays to actual count
        uint256[] memory resultMonths = new uint256[](count);
        uint256[] memory resultYears = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            resultMonths[i] = unclaimedMonths[i];
            resultYears[i] = unclaimedYears[i];
        }

        return (resultMonths, resultYears);
    }

    /**
     * @dev Internal helper to check if month is claimable for a specific employee
     */
    function isMonthClaimableForEmployee(
        uint256 payrollId,
        address employee,
        uint256 month,
        uint256 year,
        PayrollData memory payroll
    ) internal view returns (bool) {
        if (!payroll.active) return false;

        // Check if already claimed
        if (monthlyClaims[payrollId][employee][month][year]) return false;

        // Check if within payroll period
        uint256 monthsElapsed = getMonthsElapsed(payroll.startMonth, payroll.startYear, month, year);
        if (monthsElapsed >= payroll.months) return false;

        // Get current day of month
        uint256 currentDay = getDayOfMonth(block.timestamp);
        (uint256 currentMonth, uint256 currentYear) = getCurrentMonthYear();
        
        // Can claim if:
        // 1. Previous month/year that hasn't been claimed
        // 2. Current month/year and payment day has passed
        if (year < currentYear || (year == currentYear && month < currentMonth)) {
            return true; // Previous month - can claim
        } else if (year == currentYear && month == currentMonth) {
            return currentDay >= payroll.paymentDay; // Current month - check payment day
        }
        
        return false;
    }

    /**
     * @dev Get months elapsed between two month/year pairs
     */
    function getMonthsElapsed(
        uint256 startMonth,
        uint256 startYear,
        uint256 endMonth,
        uint256 endYear
    ) internal pure returns (uint256) {
        if (endYear < startYear) return 0;
        if (endYear == startYear && endMonth < startMonth) return 0;
        
        uint256 yearsDiff = endYear - startYear;
        uint256 monthsDiff = endMonth >= startMonth 
            ? endMonth - startMonth 
            : (12 - startMonth) + endMonth;
        
        return (yearsDiff * 12) + monthsDiff;
    }

    /**
     * @dev Get current month and year from timestamp
     */
    function getCurrentMonthYear() internal view returns (uint256 month, uint256 year) {
        // This is a simplified implementation
        // In production, use a proper date library or oracle
        uint256 timestamp = block.timestamp;
        
        // Approximate: Jan 1, 1970 = 0
        // Each month is approximately 2,592,000 seconds (30 days)
        uint256 monthsSinceEpoch = timestamp / 2592000;
        
        year = 1970 + (monthsSinceEpoch / 12);
        month = (monthsSinceEpoch % 12) + 1;
        
        if (month == 0) month = 1;
        if (month > 12) month = 12;
    }

    /**
     * @dev Get day of month from timestamp
     */
    function getDayOfMonth(uint256 timestamp) internal pure returns (uint256) {
        // Simplified implementation
        uint256 daysSinceEpoch = timestamp / 86400;
        uint256 day = (daysSinceEpoch % 31) + 1;
        if (day == 0) day = 1;
        if (day > 31) day = 31;
        return day;
    }

    /**
     * @dev Get payroll data
     */
    function getPayroll(uint256 payrollId) external view returns (PayrollData memory) {
        return payrolls[payrollId];
    }

    /**
     * @dev Get employee payment data
     */
    function getEmployeePayment(uint256 payrollId, address employee) external view returns (EmployeePayment memory) {
        return employeePayments[payrollId][employee];
    }

    /**
     * @dev Get all employees for a payroll
     */
    function getPayrollEmployees(uint256 payrollId) external view returns (address[] memory) {
        return payrollEmployees[payrollId];
    }

    /**
     * @dev Check if a specific month has been claimed
     */
    function hasClaimedMonth(uint256 payrollId, address employee, uint256 month, uint256 year) external view returns (bool) {
        return monthlyClaims[payrollId][employee][month][year];
    }
}
