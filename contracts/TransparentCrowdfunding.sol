// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract TransparentCrowdfunding is ReentrancyGuard, AccessControl, Pausable {
    // Roles
    bytes32 public constant PROJECT_CREATOR_ROLE = keccak256("PROJECT_CREATOR_ROLE");
    
    // Project Status
    enum ProjectStatus { Active, Completed, Cancelled }
    
    // Expense Category
    enum ExpenseCategory { 
        Development, 
        Marketing, 
        Operations, 
        Infrastructure, 
        Other
    }

    struct Project {
        string title;
        string description;
        address payable creator;
        uint256 goalAmount;
        uint256 currentAmount;
        uint256 deadline;
        ProjectStatus status;
        bool fundsReleased;
        uint256 totalExpenses;
        uint256 createdAt;
    }

    struct Expense {
        string description;
        uint256 amount;
        ExpenseCategory category;
        uint256 timestamp;
        bool approved;
        string proofUrl;
    }

    struct Contribution {
        address contributor;
        uint256 amount;
        uint256 timestamp;
    }

    // Mappings
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Expense[]) public projectExpenses;
    mapping(uint256 => Contribution[]) public projectContributions;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => bool)) public refundClaimed;

    // State variables
    uint256 public projectCount;
    uint256 public constant MINIMUM_CONTRIBUTION = 0.01 ether;
    uint256 public constant MINIMUM_FUNDING_PERIOD = 1 days;
    uint256 public constant MAXIMUM_FUNDING_PERIOD = 90 days;

    // Events
    event ProjectCreated(
        uint256 indexed projectId, 
        string title, 
        address creator, 
        uint256 goalAmount, 
        uint256 deadline
    );
    event ContributionMade(
        uint256 indexed projectId, 
        address indexed contributor, 
        uint256 amount
    );
    event ExpenseSubmitted(
        uint256 indexed projectId, 
        uint256 expenseIndex, 
        string description, 
        uint256 amount
    );
    event ExpenseApproved(uint256 indexed projectId, uint256 expenseIndex);
    event FundsReleased(uint256 indexed projectId, uint256 amount);
    event ProjectCompleted(uint256 indexed projectId);
    event ProjectCancelled(uint256 indexed projectId);
    event RefundClaimed(uint256 indexed projectId, address indexed contributor, uint256 amount);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROJECT_CREATOR_ROLE, msg.sender);
    }

    /**
     * @dev Creates a new crowdfunding project
     */
    function createProject(
        string memory title,
        string memory description,
        uint256 goalAmount,
        uint256 durationInDays
    ) external whenNotPaused onlyRole(PROJECT_CREATOR_ROLE) {
        require(goalAmount > 0, "Goal amount must be greater than 0");
        require(durationInDays * 1 days >= MINIMUM_FUNDING_PERIOD, "Duration too short");
        require(durationInDays * 1 days <= MAXIMUM_FUNDING_PERIOD, "Duration too long");

        uint256 projectId = projectCount++;
        uint256 deadline = block.timestamp + (durationInDays * 1 days);

        Project storage newProject = projects[projectId];
        newProject.title = title;
        newProject.description = description;
        newProject.creator = payable(msg.sender);
        newProject.goalAmount = goalAmount;
        newProject.deadline = deadline;
        newProject.status = ProjectStatus.Active;
        newProject.createdAt = block.timestamp;

        emit ProjectCreated(projectId, title, msg.sender, goalAmount, deadline);
    }

    /**
     * @dev Allows users to contribute to a project
     */
    function contribute(uint256 projectId) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
    {
        Project storage project = projects[projectId];
        require(project.creator != address(0), "Project does not exist");
        require(project.status == ProjectStatus.Active, "Project is not active");
        require(block.timestamp < project.deadline, "Project funding period has ended");
        require(msg.value >= MINIMUM_CONTRIBUTION, "Contribution too small");
        require(
            project.currentAmount + msg.value <= project.goalAmount, 
            "Exceeds project goal"
        );

        project.currentAmount += msg.value;
        contributions[projectId][msg.sender] += msg.value;

        projectContributions[projectId].push(Contribution({
            contributor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        emit ContributionMade(projectId, msg.sender, msg.value);
    }

    /**
     * @dev Allows project creator to submit an expense
     */
    function submitExpense(
        uint256 projectId,
        string memory description,
        uint256 amount,
        ExpenseCategory category,
        string memory proofUrl
    ) external whenNotPaused {
        Project storage project = projects[projectId];
        require(msg.sender == project.creator, "Only creator can submit expenses");
        require(project.status != ProjectStatus.Cancelled, "Project is cancelled");
        require(
            project.currentAmount >= project.totalExpenses + amount,
            "Insufficient funds"
        );

        projectExpenses[projectId].push(Expense({
            description: description,
            amount: amount,
            category: category,
            timestamp: block.timestamp,
            approved: false,
            proofUrl: proofUrl
        }));

        emit ExpenseSubmitted(
            projectId, 
            projectExpenses[projectId].length - 1, 
            description, 
            amount
        );
    }

    /**
     * @dev Allows admin to approve an expense
     */
    function approveExpense(uint256 projectId, uint256 expenseIndex) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        Project storage project = projects[projectId];
        require(project.status != ProjectStatus.Cancelled, "Project is cancelled");
        
        Expense storage expense = projectExpenses[projectId][expenseIndex];
        require(!expense.approved, "Expense already approved");

        expense.approved = true;
        project.totalExpenses += expense.amount;

        // Release funds to project creator
        (bool success, ) = project.creator.call{value: expense.amount}("");
        require(success, "Transfer failed");

        emit ExpenseApproved(projectId, expenseIndex);
        emit FundsReleased(projectId, expense.amount);
    }

    /**
     * @dev Completes a project
     */
    function completeProject(uint256 projectId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        Project storage project = projects[projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        
        project.status = ProjectStatus.Completed;
        emit ProjectCompleted(projectId);
    }

    /**
     * @dev Cancels a project and enables refunds
     */
    function cancelProject(uint256 projectId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        Project storage project = projects[projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        
        project.status = ProjectStatus.Cancelled;
        emit ProjectCancelled(projectId);
    }

    /**
     * @dev Allows contributors to claim refunds for cancelled projects
     */
    function claimRefund(uint256 projectId) external nonReentrant {
        Project storage project = projects[projectId];
        require(project.status == ProjectStatus.Cancelled, "Project not cancelled");
        
        uint256 contributionAmount = contributions[projectId][msg.sender];
        require(contributionAmount > 0, "No contribution found");
        require(!refundClaimed[projectId][msg.sender], "Refund already claimed");

        refundClaimed[projectId][msg.sender] = true;
        
        (bool success, ) = payable(msg.sender).call{value: contributionAmount}("");
        require(success, "Transfer failed");

        emit RefundClaimed(projectId, msg.sender, contributionAmount);
    }

    /**
     * @dev Returns all expenses for a project
     */
    function getProjectExpenses(uint256 projectId) 
        external 
        view 
        returns (Expense[] memory) 
    {
        return projectExpenses[projectId];
    }

    /**
     * @dev Returns all contributions for a project
     */
    function getProjectContributions(uint256 projectId) 
        external 
        view 
        returns (Contribution[] memory) 
    {
        return projectContributions[projectId];
    }

    /**
     * @dev Administrative functions
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function grantProjectCreatorRole(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(PROJECT_CREATOR_ROLE, account);
    }

    receive() external payable {
        revert("Direct deposits not accepted");
    }
}