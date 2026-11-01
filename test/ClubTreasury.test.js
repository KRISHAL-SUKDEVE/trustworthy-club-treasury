const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Trustworthy Club Treasury - Comprehensive Security & Functional Tests", function () {
  let ClubTreasury;
  let treasury;
  let owner;
  let alice;
  let bob;
  let charlie;
  let vendor;

  const membershipFee = ethers.parseEther("0.01");
  const genesisFunding = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, alice, bob, charlie, vendor] = await ethers.getSigners();

    ClubTreasury = await ethers.getContractFactory("ClubTreasury");
    treasury = await ClubTreasury.deploy(
      "Meraz Hacker Club",
      "Official decentralized club treasury for campus events",
      membershipFee,
      { value: genesisFunding }
    );
    await treasury.waitForDeployment();
  });

  describe("1. Initialization & Bootstrap", function () {
    it("Should properly initialize metadata and treasury balance", async function () {
      expect(await treasury.clubName()).to.equal("Meraz Hacker Club");
      expect(await treasury.membershipFee()).to.equal(membershipFee);
      expect(await ethers.provider.getBalance(await treasury.getAddress())).to.equal(genesisFunding);
      expect(await treasury.totalInflow()).to.equal(genesisFunding);
      expect(await treasury.totalOutflow()).to.equal(0);
    });

    it("Should register deployer as initial member with 1 active member", async function () {
      expect(await treasury.isMember(owner.address)).to.be.true;
      expect(await treasury.activeMemberCount()).to.equal(1);
    });

    it("Should verify NO backdoors exist (no owner/admin withdraw function)", async function () {
      expect(treasury.withdrawAll).to.be.undefined;
      expect(treasury.drain).to.be.undefined;
      expect(treasury.ownerWithdraw).to.be.undefined;
    });
  });

  describe("2. Membership Participation", function () {
    it("Allows users to join by paying the membership fee", async function () {
      await expect(treasury.connect(alice).joinClub({ value: membershipFee }))
        .to.emit(treasury, "MemberJoined")
        .withArgs(alice.address, membershipFee, anyValue);

      expect(await treasury.isMember(alice.address)).to.be.true;
      expect(await treasury.activeMemberCount()).to.equal(2);
    });

    it("Rejects membership join if fee is insufficient", async function () {
      await expect(
        treasury.connect(bob).joinClub({ value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Sent amount is below required membership fee");
    });

    it("Prevents already joined members from joining again", async function () {
      await treasury.connect(alice).joinClub({ value: membershipFee });
      await expect(
        treasury.connect(alice).joinClub({ value: membershipFee })
      ).to.be.revertedWith("Already an active member");
    });

    it("Allows members to voluntarily leave the club", async function () {
      await treasury.connect(alice).joinClub({ value: membershipFee });
      expect(await treasury.activeMemberCount()).to.equal(2);

      await expect(treasury.connect(alice).leaveClub())
        .to.emit(treasury, "MemberLeft")
        .withArgs(alice.address, anyValue);

      expect(await treasury.isMember(alice.address)).to.be.false;
      expect(await treasury.activeMemberCount()).to.equal(1);
    });
  });

  describe("3. Treasury Inflow & Direct Donations", function () {
    it("Accepts direct ETH contributions via receive() and records inflow", async function () {
      const donation = ethers.parseEther("0.5");
      await charlie.sendTransaction({
        to: await treasury.getAddress(),
        value: donation,
      });

      expect(await treasury.totalInflow()).to.equal(genesisFunding + donation);
      const inflows = await treasury.getInflowRecords();
      expect(inflows.length).to.equal(2); // genesis + donation
      expect(inflows[1].sender).to.equal(charlie.address);
      expect(inflows[1].note).to.equal("Direct Donation");
    });

    it("Accepts tagged deposits via deposit(note)", async function () {
      const sponsorAmount = ethers.parseEther("2.0");
      await expect(
        treasury.connect(charlie).deposit("Alumni Fest Sponsorship", { value: sponsorAmount })
      )
        .to.emit(treasury, "FundsReceived")
        .withArgs(charlie.address, sponsorAmount, "Alumni Fest Sponsorship", anyValue);

      expect(await treasury.totalInflow()).to.equal(genesisFunding + sponsorAmount);
    });
  });

  describe("4. Governance: Proposals & Voting", function () {
    beforeEach(async function () {
      await treasury.connect(alice).joinClub({ value: membershipFee });
      await treasury.connect(bob).joinClub({ value: membershipFee });
    });

    it("Only members can create proposals", async function () {
      await expect(
        treasury.connect(charlie).createProposal(
          0, // SPENDING
          vendor.address,
          ethers.parseEther("0.1"),
          "Event Snacks",
          "Snacks for Meraz workshop",
          60
        )
      ).to.be.revertedWith("Access denied: Caller is not a club member");
    });

    it("Creates proposal, auto-casts proposer's YES vote", async function () {
      await treasury.connect(alice).createProposal(
        0,
        vendor.address,
        ethers.parseEther("0.2"),
        "Audio System Rental",
        "Microphones and speakers for L-101",
        60
      );

      const prop = (await treasury.getAllProposals())[0];
      expect(prop.title).to.equal("Audio System Rental");
      expect(prop.amount).to.equal(ethers.parseEther("0.2"));
      expect(prop.yesVotes).to.equal(1);
      expect(prop.noVotes).to.equal(0);
      expect(prop.executed).to.be.false;
      expect(await treasury.hasVoted(0, alice.address)).to.be.true;
    });

    it("Prevents double voting by the same member", async function () {
      await treasury.connect(alice).createProposal(
        0,
        vendor.address,
        ethers.parseEther("0.2"),
        "Audio",
        "Speakers",
        60
      );

      await expect(treasury.connect(alice).vote(0, true)).to.be.revertedWith(
        "Member has already voted on this proposal"
      );
    });

    it("Allows other members to vote and updates tallies", async function () {
      await treasury.connect(alice).createProposal(
        0,
        vendor.address,
        ethers.parseEther("0.2"),
        "Audio",
        "Speakers",
        60
      );

      await treasury.connect(bob).vote(0, false); // Bob votes NO
      await treasury.connect(owner).vote(0, true); // Owner votes YES

      const prop = (await treasury.getAllProposals())[0];
      expect(prop.yesVotes).to.equal(2);
      expect(prop.noVotes).to.equal(1);
    });
  });

  describe("5. Mandatory Safety Invariants & Execution Enforcement", function () {
    beforeEach(async function () {
      await treasury.connect(alice).joinClub({ value: membershipFee });
      await treasury.connect(bob).joinClub({ value: membershipFee });
    });

    it("Invariant: Cannot execute before voting deadline has passed", async function () {
      await treasury.connect(alice).createProposal(
        0,
        vendor.address,
        ethers.parseEther("0.1"),
        "Certificates",
        "Printing certificates",
        100
      );

      await expect(treasury.executeProposal(0)).to.be.revertedWith(
        "Voting deadline has not elapsed yet"
      );
    });

    it("Invariant: Rejected proposal CANNOT move funds", async function () {
      await treasury.connect(alice).createProposal(
        0,
        vendor.address,
        ethers.parseEther("0.1"),
        "Frivolous Expense",
        "Luxury gift",
        60
      );

      await treasury.connect(bob).vote(0, false);
      await treasury.connect(owner).vote(0, false);

      await time.increase(65);

      await expect(treasury.executeProposal(0)).to.be.revertedWith(
        "Proposal rejected: YES votes must strictly exceed NO votes"
      );
    });

    it("Invariant: Approved proposal moves exact funds to recipient, records audit log", async function () {
      const payoutAmount = ethers.parseEther("0.5");
      await treasury.connect(alice).createProposal(
        0,
        vendor.address,
        payoutAmount,
        "Stage Lighting",
        "Rent stage lights for fest night",
        60
      );

      await treasury.connect(bob).vote(0, true);
      await time.increase(65);

      const vendorBalanceBefore = await ethers.provider.getBalance(vendor.address);

      await expect(treasury.connect(charlie).executeProposal(0))
        .to.emit(treasury, "ProposalExecuted")
        .withArgs(0, charlie.address, payoutAmount, anyValue);

      const vendorBalanceAfter = await ethers.provider.getBalance(vendor.address);
      expect(vendorBalanceAfter - vendorBalanceBefore).to.equal(payoutAmount);

      expect(await treasury.totalOutflow()).to.equal(payoutAmount);

      const outflows = await treasury.getOutflowRecords();
      expect(outflows.length).to.equal(1);
      expect(outflows[0].recipient).to.equal(vendor.address);
      expect(outflows[0].amount).to.equal(payoutAmount);
    });

    it("Invariant: Cannot execute proposal more than once (no replay / double payout)", async function () {
      await treasury.connect(alice).createProposal(
        0,
        vendor.address,
        ethers.parseEther("0.2"),
        "Refreshments",
        "Snacks",
        60
      );

      await time.increase(65);
      await treasury.executeProposal(0);

      await expect(treasury.executeProposal(0)).to.be.revertedWith(
        "Invariant: Proposal already executed"
      );
    });

    it("Invariant: Contract CANNOT pay out more than it holds", async function () {
      const currentBalance = await ethers.provider.getBalance(await treasury.getAddress());
      
      await expect(
        treasury.connect(alice).createProposal(
          0,
          vendor.address,
          currentBalance + ethers.parseEther("1.0"),
          "Deficit Spending",
          "Exceeding treasury",
          60
        )
      ).to.be.revertedWith("Cannot propose more than current treasury balance");
    });
  });
});

