# 🛡️ Round 2: Vulnerability Hunting & Audit Checklist
## VIBECHAIN – MERAZ 7.0 (IIT Bhilai)

Use this guide during **Round 2 (Break the Bugs)** to rapidly discover and report vulnerabilities in competitor repositories.

---

## 🎯 High-Impact Bug Categories & How to Spot Them

### 1. 🚨 Admin Backdoors & Privilege Abuse (Core Design Flaw)
* **What to check:** Search the contract for `onlyOwner`, `owner`, `admin`, `withdraw`, `drain`, `sweep`, or `emergency`.
* **The Vulnerability:** The problem statement explicitly requires: *"No admin, owner or deployer may be able to move funds outside the rules the contract defines."*
* **Exploit Impact:** If an owner or deployer can withdraw funds directly or bypass proposal voting, it violates the core requirement.
* **How to Report:**
  > **Severity:** Critical  
  > **Finding:** Admin Backdoor Allows Deployer to Drain Treasury  
  > **Location:** `contracts/Treasury.sol:L...`  
  > **Description:** The function `emergencyWithdraw()` (or `withdrawAll()`) possesses an `onlyOwner` modifier that allows the deployer to unilaterally extract funds without member voting or proposal approval. This breaks the mandatory requirement "No backdoors".

---

### 2. 🔄 Reentrancy Attack in `executeProposal()`
* **What to check:** Look at how funds are sent in the execution function.
  ```solidity
  // VULNERABLE PATTERN:
  (bool sent, ) = recipient.call{value: amount}(""); // External call FIRST
  proposal.executed = true;                          // State update AFTER
  ```
* **The Vulnerability:** If state update happens AFTER the external call without a reentrancy guard, a malicious recipient contract can re-enter `executeProposal()` recursively and drain the entire treasury in a single transaction!
* **How to Report:**
  > **Severity:** Critical  
  > **Finding:** Reentrancy in Proposal Execution Allows Total Fund Drain  
  > **Location:** `contracts/Treasury.sol:L...`  
  > **Description:** The contract invokes an external call to `recipient` before setting `proposal.executed = true` and lacks `nonReentrant` protection. A malicious fallback contract can re-enter `executeProposal` to drain the entire balance.

---

### 3. 🔁 Replay / Double Execution Attack
* **What to check:** Is `executed` boolean checked and updated properly?
* **The Vulnerability:** If the contract fails to mark `executed = true`, or uses a check that can be bypassed, the same approved proposal can be executed multiple times until the treasury is empty.
* **How to Report:**
  > **Severity:** High  
  > **Finding:** Missing Execution Flag Enables Replay / Double Payout  
  > **Description:** Invariant violation: No authorization can be used to move funds more than it was granted for.

---

### 4. ⏰ Premature or Expired Execution Timing Flaws
* **What to check:**
  * Can a proposal be executed *while* voting is still ongoing? (`block.timestamp < deadline` instead of `>= deadline`).
  * Can an expired or rejected proposal be executed?
  * Can votes be cast after the deadline has passed?
* **How to Report:**
  > **Severity:** Medium / High  
  > **Finding:** Premature Execution Before Voting Window Closes  
  > **Description:** The contract permits `executeProposal` to be invoked before `votingDeadline` has elapsed, allowing a proposer to rush execution before other members can cast `NO` votes.

---

### 5. 👥 Double Voting / Sybil Attack
* **What to check:**
  * Does the contract track `hasVoted[proposalId][msg.sender]`?
  * Can a member vote multiple times by calling `vote()` in a loop?
  * Can someone vote, transfer their membership / tokens to another address, and vote again?
* **How to Report:**
  > **Severity:** High  
  > **Finding:** Missing Vote Tracking Permits Unlimited Voting Power  
  > **Description:** The `vote()` function does not check if `hasVoted` is true for the sender, allowing a single member to inflate vote tallies arbitrarily.

---

### 6. 💸 Balance Invariant Violations (Deficit Spending)
* **What to check:**
  * Does the contract check `address(this).balance >= amount`?
  * If a proposal asks for 100 ETH when the treasury only has 5 ETH, what happens? If it executes or reverts unexpectedly, does it lock other proposals?
* **How to Report:**
  > **Severity:** Medium  
  > **Finding:** Invariant Breach: Contract Allows Proposals Exceeding Balance  
  > **Description:** Contract allows creation and passing of spending proposals larger than the treasury holdings without safe handling.

---

## 📝 Official Vulnerability Report Template for Submission

When submitting findings during Round 2, use this structured format for maximum points:

```markdown
### Bug Report: [Title of Vulnerability]

**Target Repository:** [GitHub Repo Link of Target Team]
**Affected File:** [e.g., contracts/ClubTreasury.sol, line 42-55]
**Severity:** [Critical / High / Medium / Low]

#### 1. Vulnerability Summary
[Concise 2-sentence explanation of the flaw and how it can be abused.]

#### 2. Root Cause Analysis
[Code snippet showing the vulnerable lines and why it fails security invariants.]

#### 3. Exploit Scenario / Proof of Concept
1. Attacker creates a malicious contract at address X.
2. Attacker submits a proposal for 1 ETH.
3. Once approved, attacker triggers executeProposal().
4. Attacker's fallback function re-enters executeProposal() before the balance is deducted, siphoning all funds.

#### 4. Impact
[Violation of problem statement requirements: e.g. Unauthorized fund movement, theft of treasury balance, denial of service.]

#### 5. Recommended Remediation
[Provide the corrected Solidity code using Checks-Effects-Interactions or OpenZeppelin patterns.]
```
