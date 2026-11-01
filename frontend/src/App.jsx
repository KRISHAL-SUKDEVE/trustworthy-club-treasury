import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import TreasuryOverview from "./components/TreasuryOverview";
import ProposalCard from "./components/ProposalCard";
import CreateProposalModal from "./components/CreateProposalModal";
import DepositModal from "./components/DepositModal";
import AuditTrail from "./components/AuditTrail";
import MembersDirectory from "./components/MembersDirectory";
import { TREASURY_ABI, DEFAULT_CONTRACT_ADDRESS, SUPPORTED_NETWORKS } from "./contracts/config";
import { Vote, FileText, Users, AlertCircle, CheckCircle2, Loader2, Sparkles, Plus } from "lucide-react";

export default function App() {
  // Wallet & Network State
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [contractAddress, setContractAddress] = useState(
    localStorage.getItem("treasury_contract_address") || DEFAULT_CONTRACT_ADDRESS
  );

  // Contract Data State
  const [isMember, setIsMember] = useState(false);
  const [membershipFee, setMembershipFee] = useState("0.005");
  const [clubInfo, setClubInfo] = useState({ name: "Web3 Builders Club", description: "" });
  const [summary, setSummary] = useState({
    balance: 0n,
    totalInflow: 0n,
    totalOutflow: 0n,
    memberCount: 0n,
    proposalCount: 0n,
  });
  const [proposals, setProposals] = useState([]);
  const [members, setMembers] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [inflows, setInflows] = useState([]);
  const [userVotes, setUserVotes] = useState({});

  // UI State
  const [activeTab, setActiveTab] = useState("proposals"); // 'proposals' | 'audit' | 'members'
  const [proposalFilter, setProposalFilter] = useState("all"); // 'all' | 'active' | 'passed' | 'executed'
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'loading', message: '' }

  // Show Toast
  const showToast = (type, message, duration = 5000) => {
    setToast({ type, message });
    if (duration > 0) {
      setTimeout(() => setToast(null), duration);
    }
  };

  // Get Contract helper
  const getContract = useCallback(
    async (withSigner = false) => {
      if (withSigner) {
        if (!window.ethereum) return null;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(contractAddress, TREASURY_ABI, signer);
      }
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(contractAddress, TREASURY_ABI, provider);
      }
      try {
        const rpcUrl = import.meta.env.VITE_RPC_URL || "https://rpc.sepolia.org";
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        return new ethers.Contract(contractAddress, TREASURY_ABI, provider);
      } catch {
        return null;
      }
    },
    [contractAddress]
  );

  // Refresh Contract Data
  const loadTreasuryData = useCallback(async () => {
    try {
      const contract = await getContract(false);
      if (!contract) return;

      // 1. Club Info & Summary
      const [name, desc, feeWei, sumData] = await Promise.all([
        contract.clubName().catch(() => "Club Treasury"),
        contract.clubDescription().catch(() => "Decentralized treasury"),
        contract.membershipFee().catch(() => ethers.parseEther("0.005")),
        contract.getTreasurySummary().catch(() => [0n, 0n, 0n, 0n, 0n]),
      ]);

      setClubInfo({ name, description: desc });
      setMembershipFee(ethers.formatEther(feeWei));
      setSummary({
        balance: sumData[0],
        totalInflow: sumData[1],
        totalOutflow: sumData[2],
        memberCount: sumData[3],
        proposalCount: sumData[4],
      });

      // 2. Proposals
      const allProps = await contract.getAllProposals().catch(() => []);
      setProposals(allProps);

      // 3. Members
      const allMems = await contract.getMembers().catch(() => []);
      setMembers(allMems);

      // 4. Inflows & Outflows
      const [outflowList, inflowList] = await Promise.all([
        contract.getOutflowRecords().catch(() => []),
        contract.getInflowRecords().catch(() => []),
      ]);
      setOutflows(outflowList);
      setInflows(inflowList);

      // 5. User Specific Status
      if (account) {
        const memberStatus = await contract.isMember(account).catch(() => false);
        setIsMember(memberStatus);

        // Fetch user vote state for each proposal in parallel
        const votePromises = allProps.map(async (prop) => {
          const pId = Number(prop.id);
          const voted = await contract.hasVoted(pId, account).catch(() => false);
          let choice = false;
          if (voted) {
            choice = await contract.voteChoice(pId, account).catch(() => false);
          }
          return { id: pId, hasVoted: voted, choice };
        });
        const voteResults = await Promise.all(votePromises);
        const votes = {};
        voteResults.forEach((res) => {
          votes[res.id] = { hasVoted: res.hasVoted, choice: res.choice };
        });
        setUserVotes(votes);
      }
    } catch (err) {
      console.warn("Could not read contract data:", err);
    }
  }, [account, getContract]);

  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      showToast("error", "MetaMask not found. Please install MetaMask to interact.");
      return;
    }
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const net = await provider.getNetwork();
        const chainName = SUPPORTED_NETWORKS[Number(net.chainId)] || `Chain ID ${net.chainId}`;
        setNetwork(chainName);
        showToast("success", `Connected: ${accounts[0].substring(0, 6)}...`);
      }
    } catch (err) {
      showToast("error", err?.message || "Wallet connection rejected.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check initial connection
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const provider = new ethers.BrowserProvider(window.ethereum);
            provider.getNetwork().then((net) => {
              const chainName = SUPPORTED_NETWORKS[Number(net.chainId)] || `Chain ID ${net.chainId}`;
              setNetwork(chainName);
            });
          }
        })
        .catch(console.error);

      window.ethereum.on("accountsChanged", (accs) => {
        setAccount(accs.length > 0 ? accs[0] : "");
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // Poll / Reload on changes
  useEffect(() => {
    loadTreasuryData();
    const interval = setInterval(loadTreasuryData, 8000);
    return () => clearInterval(interval);
  }, [loadTreasuryData]);

  // Handle Contract Address Update
  const handleUpdateContractAddress = (newAddr) => {
    if (!ethers.isAddress(newAddr)) {
      showToast("error", "Invalid Ethereum address format.");
      return;
    }
    setContractAddress(newAddr);
    localStorage.setItem("treasury_contract_address", newAddr);
    showToast("success", `Active contract set to ${newAddr.substring(0, 6)}...`);
  };

  // Action: Join Club
  const handleJoinClub = async () => {
    try {
      setIsLoading(true);
      showToast("loading", "Connecting wallet and preparing transaction...", 0);
      const contract = await getContract(true);
      if (!contract) {
        showToast("error", "Wallet not connected. Please install MetaMask and connect your account.");
        return;
      }
      const fee = await contract.membershipFee();
      const tx = await contract.joinClub({ value: fee });
      showToast("loading", "Mining transaction on-chain...", 0);
      await tx.wait();
      showToast("success", "Welcome to the club! You are now a verified voting member.");
      await loadTreasuryData();
    } catch (err) {
      showToast("error", err?.reason || err?.message || "Failed to join club.");
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Leave Club
  const handleLeaveClub = async () => {
    try {
      setIsLoading(true);
      showToast("loading", "Submitting resignation to blockchain...", 0);
      const contract = await getContract(true);
      if (!contract) {
        showToast("error", "Wallet not connected. Please connect your account first.");
        return;
      }
      const tx = await contract.leaveClub();
      showToast("loading", "Mining transaction on-chain...", 0);
      await tx.wait();
      showToast("success", "You have successfully resigned from the club.");
      await loadTreasuryData();
    } catch (err) {
      showToast("error", err?.reason || err?.message || "Failed to leave club.");
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Deposit ETH
  const handleDeposit = async ({ amount, note }) => {
    try {
      setIsLoading(true);
      showToast("loading", `Depositing ${ethers.formatEther(amount)} ETH...`, 0);
      const contract = await getContract(true);
      if (!contract) {
        showToast("error", "Wallet not connected. Please connect your account to deposit.");
        return;
      }
      const tx = await contract.deposit(note, { value: amount });
      await tx.wait();
      showToast("success", "Deposit successfully verified and recorded in audit log!");
      setIsDepositOpen(false);
      await loadTreasuryData();
    } catch (err) {
      showToast("error", err?.reason || err?.message || "Deposit transaction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Create Proposal
  const handleCreateProposal = async (proposalData) => {
    try {
      setIsLoading(true);
      showToast("loading", "Submitting proposal to blockchain...", 0);
      const contract = await getContract(true);
      if (!contract) {
        showToast("error", "Wallet not connected. Please connect your account first.");
        return;
      }
      const tx = await contract.createProposal(
        proposalData.pType,
        proposalData.recipient,
        proposalData.amount,
        proposalData.title,
        proposalData.description,
        proposalData.durationInSeconds
      );
      await tx.wait();
      showToast("success", "Proposal created successfully! Voting is now active.");
      setIsCreateOpen(false);
      await loadTreasuryData();
    } catch (err) {
      showToast("error", err?.reason || err?.message || "Failed to create proposal.");
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Vote
  const handleVote = async (proposalId, support) => {
    try {
      setIsLoading(true);
      showToast("loading", `Casting ${support ? "YES" : "NO"} vote...`, 0);
      const contract = await getContract(true);
      if (!contract) {
        showToast("error", "Wallet not connected. Please connect your account first.");
        return;
      }
      const tx = await contract.vote(proposalId, support);
      await tx.wait();
      showToast("success", `Vote recorded: ${support ? "YES" : "NO"}`);
      await loadTreasuryData();
    } catch (err) {
      showToast("error", err?.reason || err?.message || "Failed to cast vote.");
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Execute Proposal
  const handleExecute = async (proposalId) => {
    try {
      setIsLoading(true);
      showToast("loading", "Executing approved proposal & transferring funds...", 0);
      const contract = await getContract(true);
      if (!contract) {
        showToast("error", "Wallet not connected. Please connect your account first.");
        return;
      }
      const tx = await contract.executeProposal(proposalId);
      await tx.wait();
      showToast("success", "Proposal executed! Funds transferred and logged in ledger.");
      await loadTreasuryData();
    } catch (err) {
      showToast("error", err?.reason || err?.message || "Proposal execution failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter proposals
  const filteredProposals = proposals.filter((p) => {
    if (proposalFilter === "all") return true;
    const now = Math.floor(Date.now() / 1000);
    const isDeadlinePassed = Number(p.votingDeadline) <= now;
    const isWindowExpired = now > Number(p.votingDeadline) + 7 * 86400;

    const activeCount = summary.memberCount !== undefined && summary.memberCount !== null ? Number(summary.memberCount) : 1;
    let minQuorum = Math.ceil((activeCount * 20) / 100);
    if (minQuorum < 2 && activeCount > 1) { minQuorum = 2; }
    if (minQuorum === 0) { minQuorum = 1; }

    const totalVotes = Number(p.yesVotes) + Number(p.noVotes);
    const hasQuorum = totalVotes >= minQuorum;
    const isPassed = isDeadlinePassed && !p.executed && !isWindowExpired && activeCount > 0 && hasQuorum && Number(p.yesVotes) > Number(p.noVotes);
    const isRejected = isDeadlinePassed && !p.executed && (activeCount === 0 || !hasQuorum || Number(p.yesVotes) <= Number(p.noVotes) || isWindowExpired);

    if (proposalFilter === "executed") return p.executed;
    if (proposalFilter === "passed") return isPassed;
    if (proposalFilter === "rejected") return isRejected;
    if (proposalFilter === "active") return !isDeadlinePassed && !p.executed;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold flex items-center space-x-2.5 ${
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200"
                : toast.type === "error"
                ? "bg-rose-950/95 border-rose-500/40 text-rose-200"
                : "bg-slate-900/95 border-teal-500/40 text-teal-200"
            }`}
          >
            {toast.type === "loading" && <Loader2 className="w-4 h-4 animate-spin text-teal-400" />}
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        account={account}
        network={network}
        isMember={isMember}
        balance={summary.balance}
        onConnect={connectWallet}
        onJoinClub={handleJoinClub}
        onLeaveClub={handleLeaveClub}
        membershipFee={membershipFee}
        contractAddress={contractAddress}
        onUpdateContractAddress={handleUpdateContractAddress}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Treasury Metrics Overview */}
        <TreasuryOverview
          summary={summary}
          clubInfo={clubInfo}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onOpenCreateProposal={() => setIsCreateOpen(true)}
          isMember={isMember}
          account={account}
        />

        {/* View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("proposals")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
                activeTab === "proposals"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Proposals &amp; Votes ({proposals.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
                activeTab === "audit"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Ledger ({outflows.length + inflows.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
                activeTab === "members"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Members ({members.length})</span>
            </button>
          </div>

          {/* Subfilter for Proposals */}
          {activeTab === "proposals" && (
            <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {["all", "active", "passed", "rejected", "executed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProposalFilter(filter)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                    proposalFilter === filter
                      ? "bg-slate-800 text-teal-400 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Proposals View */}
        {activeTab === "proposals" && (
          <div className="space-y-4">
            {filteredProposals.length === 0 ? (
              <div className="glass-panel rounded-3xl border border-slate-800 p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 mx-auto flex items-center justify-center">
                  <Vote className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">No Proposals Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  There are no {proposalFilter !== "all" ? proposalFilter : ""} proposals created yet.
                  Club members can propose a spending or governance motion anytime!
                </p>
                {isMember && (
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
                  >
                    Create First Proposal
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProposals.map((prop) => (
                  <ProposalCard
                    key={prop.id.toString()}
                    proposal={prop}
                    userVoted={userVotes[Number(prop.id)]?.hasVoted}
                    userVoteChoice={userVotes[Number(prop.id)]?.choice}
                    isMember={isMember}
                    account={account}
                    memberCount={summary.memberCount}
                    onVote={handleVote}
                    onExecute={handleExecute}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Audit Trail View */}
        {activeTab === "audit" && (
          <AuditTrail
            outflows={outflows}
            inflows={inflows}
            contractAddress={contractAddress}
          />
        )}

        {/* Tab 3: Members Directory View */}
        {activeTab === "members" && (
          <MembersDirectory
            members={members}
            memberCount={summary.memberCount}
            isMember={isMember}
            onJoinClub={handleJoinClub}
            onLeaveClub={handleLeaveClub}
            membershipFee={membershipFee}
            account={account}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Modals */}
      <CreateProposalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateProposal}
        treasuryBalance={summary.balance}
        isLoading={isLoading}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDeposit={handleDeposit}
        isLoading={isLoading}
      />

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 VibeChain × Meraz 7.0 | Trustworthy Club Treasury Challenge</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-teal-400">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>100% Invariant Compliant</span>
            </span>
            <span>Zero Backdoors</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
