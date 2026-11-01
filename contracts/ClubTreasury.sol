// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ClubTreasury
 * @dev A trustless, decentralized club treasury built for MERAZ 7.0 - VIBECHAIN.
 * 
 * CORE PRINCIPLES & INVARIANTS:
 * 1. Zero Backdoors: No owner, admin, or deployer can withdraw funds outside approved proposals.
 * 2. Democratic Governance: Spending requires on-chain proposals and majority member votes.
 * 3. Invariant Safety:
 *    - Never pays out more than the treasury holds.
 *    - No authorization can be executed more than once (replay/double-spend prevention).
 *    - Rejected, expired, or unauthorized actions can never move funds.
 *    - Reentrancy protected via strict Checks-Effects-Interactions and reentrancy mutex.
 * 4. Full Accountability: Every outflow is permanently logged with purpose and proposal reference.
 */
contract ClubTreasury {
    // -------------------------------------------------------------------------
    // Reentrancy Guard (Zero External Dependency)
    // -------------------------------------------------------------------------
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // -------------------------------------------------------------------------
    // Enums & Structs
    // -------------------------------------------------------------------------
    enum ProposalType {
        SPENDING,
        ADD_MEMBER,
        REMOVE_MEMBER
    }

    enum ProposalStatus {
        ACTIVE,
        PASSED,
        REJECTED,
        EXECUTED
    }

    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType pType;
        address payable recipient;
        uint256 amount;
        string title;
        string description;
        uint256 votingDeadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        uint256 createdAt;
    }

    struct OutflowRecord {
        uint256 proposalId;
        address recipient;
        uint256 amount;
        string purpose;
        uint256 timestamp;
    }

    struct InflowRecord {
        address sender;
        uint256 amount;
        string note;
        uint256 timestamp;
    }

    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------
    uint256 public constant EXECUTION_WINDOW = 7 days;
    string public clubName;
    string public clubDescription;
    uint256 public membershipFee; // Fee to join via direct application (in wei)
    
    // Membership Tracking (O(1) swap-and-pop)
    mapping(address => bool) public isMember;
    address[] public memberList;
    uint256 public activeMemberCount;
    mapping(address => uint256) private _memberIndex;

    function _addMember(address account) internal {
        if (!isMember[account]) {
            isMember[account] = true;
            _memberIndex[account] = memberList.length;
            memberList.push(account);
            activeMemberCount++;
        }
    }

    function _removeMember(address account) internal {
        if (isMember[account]) {
            isMember[account] = false;
            uint256 indexToRemove = _memberIndex[account];
            uint256 lastIndex = memberList.length - 1;

            if (indexToRemove != lastIndex) {
                address lastMember = memberList[lastIndex];
                memberList[indexToRemove] = lastMember;
                _memberIndex[lastMember] = indexToRemove;
            }

            memberList.pop();
            delete _memberIndex[account];

            if (activeMemberCount > 0) {
                activeMemberCount--;
            }
        }
    }

    // Financial Metrics
    uint256 public totalInflow;
    uint256 public totalOutflow;

    // Proposals & Voting
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public voteChoice; // true = YES, false = NO

    // Audit Records
    OutflowRecord[] public outflowRecords;
    InflowRecord[] public inflowRecords;

    // -------------------------------------------------------------------------
    // Events for Full Transparency
    // -------------------------------------------------------------------------
    event MemberJoined(address indexed member, uint256 feePaid, uint256 timestamp);
    event MemberLeft(address indexed member, uint256 timestamp);
    event MemberAddedByVote(address indexed member, uint256 proposalId);
    event MemberRemovedByVote(address indexed member, uint256 proposalId);
    
    event FundsReceived(address indexed donor, uint256 amount, string note, uint256 timestamp);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType pType,
        address recipient,
        uint256 amount,
        string title,
        uint256 deadline
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 timestamp
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        uint256 amount,
        uint256 timestamp
    );

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------
    modifier onlyMember() {
        require(isMember[msg.sender], "Access denied: Caller is not a club member");
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    /**
     * @notice Initializes the club treasury.
     * @param _clubName Name of the club or organization.
     * @param _clubDescription Mission statement or description.
     * @param _membershipFee Dues in wei to join directly (can be 0 for open membership).
     * @dev Deployer is granted initial membership so initial governance is bootstrapped.
     * Notice: The deployer has NO special spending privileges or backdoor access!
     */
    constructor(
        string memory _clubName,
        string memory _clubDescription,
        uint256 _membershipFee
    ) payable {
        _status = _NOT_ENTERED;
        clubName = _clubName;
        clubDescription = _clubDescription;
        membershipFee = _membershipFee;

        // Bootstrap initial member
        _addMember(msg.sender);
        emit MemberJoined(msg.sender, 0, block.timestamp);

        // Record initial funding if provided during deployment
        if (msg.value > 0) {
            totalInflow += msg.value;
            inflowRecords.push(InflowRecord({
                sender: msg.sender,
                amount: msg.value,
                note: "Genesis Treasury Funding",
                timestamp: block.timestamp
            }));
            emit FundsReceived(msg.sender, msg.value, "Genesis Treasury Funding", block.timestamp);
        }
    }

    // -------------------------------------------------------------------------
    // Treasury Inflow (Public Contributions)
    // -------------------------------------------------------------------------
    /**
     * @notice Fallback function to accept direct contributions without data.
     */
    receive() external payable {
        _recordDeposit(msg.sender, msg.value, "Direct Donation");
    }

    /**
     * @notice Deposit funds into the treasury with an explanatory memo/purpose.
     * @param note Stated purpose or message accompanying the contribution.
     */
    function deposit(string calldata note) external payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        _recordDeposit(msg.sender, msg.value, note);
    }

    function _recordDeposit(address sender, uint256 amount, string memory note) internal {
        totalInflow += amount;
        inflowRecords.push(InflowRecord({
            sender: sender,
            amount: amount,
            note: note,
            timestamp: block.timestamp
        }));
        emit FundsReceived(sender, amount, note, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Membership Management
    // -------------------------------------------------------------------------
    /**
     * @notice Allows any student/supporter to join the club by paying the required dues.
     */
    function joinClub() external payable {
        require(!isMember[msg.sender], "Already an active member");
        require(msg.value >= membershipFee, "Sent amount is below required membership fee");

        _addMember(msg.sender);

        if (msg.value > 0) {
            totalInflow += msg.value;
            inflowRecords.push(InflowRecord({
                sender: msg.sender,
                amount: msg.value,
                note: "Membership Dues",
                timestamp: block.timestamp
            }));
        }

        emit MemberJoined(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Allows a member to voluntarily resign from club voting and participation.
     */
    function leaveClub() external onlyMember {
        _removeMember(msg.sender);
        emit MemberLeft(msg.sender, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Proposal Creation (Decision-Making)
    // -------------------------------------------------------------------------
    /**
     * @notice Propose spending or membership changes.
     * @param pType SPENDING, ADD_MEMBER, or REMOVE_MEMBER.
     * @param recipient Target address for funds payout or member address.
     * @param amount Amount in wei to spend (must be 0 for membership changes).
     * @param title Brief title of the proposal.
     * @param description Detailed justification / link to invoice.
     * @param durationInSeconds Voting window duration (e.g., 60 seconds for testing or 2 days for prod).
     */
    function createProposal(
        ProposalType pType,
        address payable recipient,
        uint256 amount,
        string calldata title,
        string calldata description,
        uint256 durationInSeconds
    ) external onlyMember returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(title).length > 0, "Proposal title cannot be empty");
        require(durationInSeconds >= 30 seconds, "Voting duration must be at least 30 seconds");

        if (pType == ProposalType.SPENDING) {
            require(amount > 0, "Spending amount must be greater than zero");
            require(amount <= address(this).balance, "Cannot propose more than current treasury balance");
        } else {
            require(amount == 0, "Non-spending proposals cannot have a monetary amount");
        }

        uint256 proposalId = proposals.length;
        uint256 deadline = block.timestamp + durationInSeconds;

        proposals.push(Proposal({
            id: proposalId,
            proposer: msg.sender,
            pType: pType,
            recipient: recipient,
            amount: amount,
            title: title,
            description: description,
            votingDeadline: deadline,
            yesVotes: 1, // Proposer votes YES automatically
            noVotes: 0,
            executed: false,
            createdAt: block.timestamp
        }));

        hasVoted[proposalId][msg.sender] = true;
        voteChoice[proposalId][msg.sender] = true;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            pType,
            recipient,
            amount,
            title,
            deadline
        );
        emit VoteCast(proposalId, msg.sender, true, block.timestamp);

        return proposalId;
    }

    // -------------------------------------------------------------------------
    // Voting Mechanism
    // -------------------------------------------------------------------------
    /**
     * @notice Cast a vote on an active proposal.
     * @param proposalId The ID of the proposal.
     * @param support True for YES / For, False for NO / Against.
     */
    function vote(uint256 proposalId, bool support) external onlyMember {
        require(proposalId < proposals.length, "Proposal does not exist");
        Proposal storage prop = proposals[proposalId];

        require(block.timestamp < prop.votingDeadline, "Voting deadline has expired");
        require(!prop.executed, "Proposal has already been executed");
        require(!hasVoted[proposalId][msg.sender], "Member has already voted on this proposal");

        hasVoted[proposalId][msg.sender] = true;
        voteChoice[proposalId][msg.sender] = support;

        if (support) {
            prop.yesVotes++;
        } else {
            prop.noVotes++;
        }

        emit VoteCast(proposalId, msg.sender, support, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Execution (Enforcing Rules on Chain)
    // -------------------------------------------------------------------------
    /**
     * @notice Executes an approved proposal once the voting period has closed.
     * @dev Anyone can call this function once conditions are satisfied.
     * Follows Checks-Effects-Interactions strictly.
     * @param proposalId The ID of the proposal to execute.
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposalId < proposals.length, "Proposal does not exist");
        Proposal storage prop = proposals[proposalId];

        // Safety Invariant 3: An action rejected, expired, or never authorized must not move funds.
        require(!prop.executed, "Invariant: Proposal already executed");
        require(block.timestamp >= prop.votingDeadline, "Voting deadline has not elapsed yet");
        require(block.timestamp <= prop.votingDeadline + EXECUTION_WINDOW, "Invariant: Proposal has expired");
        require(activeMemberCount > 0, "No active members in club");

        uint256 minQuorum = (activeMemberCount * 20 + 99) / 100;
        if (minQuorum < 2 && activeMemberCount > 1) { minQuorum = 2; }
        if (minQuorum == 0) { minQuorum = 1; }
        require(prop.yesVotes + prop.noVotes >= minQuorum, "Invariant: Quorum not reached");
        require(prop.yesVotes > prop.noVotes, "Proposal rejected: YES votes must strictly exceed NO votes");

        // Mark executed BEFORE moving any funds (Checks-Effects-Interactions)
        prop.executed = true;

        if (prop.pType == ProposalType.SPENDING) {
            // Safety Invariant 1: The contract can never pay out more than it holds.
            require(address(this).balance >= prop.amount, "Invariant: Insufficient treasury balance for payout");

            // Safety Invariant 2: No authorization can move funds more than granted for.
            totalOutflow += prop.amount;
            outflowRecords.push(OutflowRecord({
                proposalId: proposalId,
                recipient: prop.recipient,
                amount: prop.amount,
                purpose: prop.title,
                timestamp: block.timestamp
            }));

            // External payout interaction
            (bool success, ) = prop.recipient.call{value: prop.amount}("");
            require(success, "External transfer failed");
        } else if (prop.pType == ProposalType.ADD_MEMBER) {
            if (!isMember[prop.recipient]) {
                _addMember(prop.recipient);
                emit MemberAddedByVote(prop.recipient, proposalId);
            }
        } else if (prop.pType == ProposalType.REMOVE_MEMBER) {
            if (isMember[prop.recipient]) {
                _removeMember(prop.recipient);
                emit MemberRemovedByVote(prop.recipient, proposalId);
            }
        }

        emit ProposalExecuted(proposalId, msg.sender, prop.amount, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // View Functions & Getters for Transparency
    // -------------------------------------------------------------------------
    /**
     * @notice Get current status string of a proposal.
     */
    function getProposalStatus(uint256 proposalId) external view returns (string memory) {
        require(proposalId < proposals.length, "Proposal does not exist");
        Proposal storage prop = proposals[proposalId];

        if (prop.executed) {
            return "EXECUTED";
        }
        if (block.timestamp < prop.votingDeadline) {
            return "ACTIVE";
        }
        if (activeMemberCount == 0) {
            return "REJECTED";
        }

        uint256 minQuorum = (activeMemberCount * 20 + 99) / 100;
        if (minQuorum < 2 && activeMemberCount > 1) { minQuorum = 2; }
        if (minQuorum == 0) { minQuorum = 1; }

        if (prop.yesVotes + prop.noVotes < minQuorum || prop.yesVotes <= prop.noVotes) {
            return "REJECTED";
        }
        if (block.timestamp > prop.votingDeadline + EXECUTION_WINDOW) {
            return "EXPIRED";
        }
        return "PASSED";
    }

    /**
     * @notice Returns key metrics of the treasury in a single RPC call.
     */
    function getTreasurySummary() external view returns (
        uint256 currentBalance,
        uint256 totalIn,
        uint256 totalOut,
        uint256 membersTotal,
        uint256 proposalsTotal
    ) {
        return (
            address(this).balance,
            totalInflow,
            totalOutflow,
            activeMemberCount,
            proposals.length
        );
    }

    /**
     * @notice Returns all proposals for frontend rendering.
     */
    function getAllProposals() external view returns (Proposal[] memory) {
        return proposals;
    }

    /**
     * @notice Returns total number of proposals created.
     */
    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }

    /**
     * @notice Returns the list of registered members.
     */
    function getMembers() external view returns (address[] memory) {
        return memberList;
    }

    /**
     * @notice Returns all verified outflow records for complete public auditability.
     */
    function getOutflowRecords() external view returns (OutflowRecord[] memory) {
        return outflowRecords;
    }

    /**
     * @notice Returns all verified inflow records.
     */
    function getInflowRecords() external view returns (InflowRecord[] memory) {
        return inflowRecords;
    }
}
