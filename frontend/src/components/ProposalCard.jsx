import React from "react";
import { CheckCircle2, XCircle, Clock, Send, Check, AlertCircle, ArrowUpRight, UserCheck, UserX } from "lucide-react";
import { formatEth, shortenAddress, formatTimestamp, getTimeRemaining } from "../utils/formatters";

export default function ProposalCard({
  proposal,
  userVoted,
  userVoteChoice,
  isMember,
  account,
  memberCount,
  onVote,
  onExecute,
  isLoading,
}) {
  const { id, proposer, pType, recipient, amount, title, description, votingDeadline, yesVotes, noVotes, executed, createdAt } = proposal;

  const totalVotes = Number(yesVotes) + Number(noVotes);
  const yesPercent = totalVotes > 0 ? Math.round((Number(yesVotes) / totalVotes) * 100) : 0;
  const noPercent = totalVotes > 0 ? 100 - yesPercent : 0;

  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = getTimeRemaining(votingDeadline);
  const isExpired = timeRemaining.expired;
  const isWindowExpired = now > Number(votingDeadline) + 7 * 86400;

  const activeCount = memberCount !== undefined && memberCount !== null ? Number(memberCount) : 1;
  let minQuorum = Math.ceil((activeCount * 20) / 100);
  if (minQuorum < 2 && activeCount > 1) { minQuorum = 2; }
  if (minQuorum === 0) { minQuorum = 1; }
  const hasQuorum = totalVotes >= minQuorum;

  // Determine on-chain state
  let status = "ACTIVE";
  let statusBadgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";

  if (executed) {
    status = "EXECUTED";
    statusBadgeClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
  } else if (isExpired) {
    if (activeCount === 0 || !hasQuorum || Number(yesVotes) <= Number(noVotes)) {
      status = "REJECTED";
      statusBadgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    } else if (isWindowExpired) {
      status = "EXPIRED";
      statusBadgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else {
      status = "PASSED (READY)";
      statusBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  }

  // Type label
  const pTypeNum = Number(pType);
  let typeLabel = "Spending";
  let typeIcon = <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />;
  if (pTypeNum === 1) {
    typeLabel = "Add Member";
    typeIcon = <UserCheck className="w-3.5 h-3.5 text-sky-400" />;
  } else if (pTypeNum === 2) {
    typeLabel = "Remove Member";
    typeIcon = <UserX className="w-3.5 h-3.5 text-rose-400" />;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
            #{id.toString()}
          </span>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            {typeIcon}
            <span>{typeLabel}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${statusBadgeClass}`}>
          {status === "ACTIVE" && <Clock className="w-3 h-3 animate-pulse" />}
          {status === "EXECUTED" && <CheckCircle2 className="w-3 h-3" />}
          {status === "REJECTED" && <XCircle className="w-3 h-3" />}
          <span>{status}</span>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      </div>

      {/* Recipient & Amount Details */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Recipient / Target Address</span>
          <span className="font-mono text-slate-200 font-semibold">{shortenAddress(recipient)}</span>
        </div>
        {pTypeNum === 0 && (
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Proposed Outflow</span>
            <span className="text-base font-extrabold text-teal-400">{formatEth(amount)} ETH</span>
          </div>
        )}
      </div>

      {/* Voting Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-emerald-400 flex items-center gap-1">
            <span>YES: {yesVotes.toString()} ({yesPercent}%)</span>
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            <span>NO: {noVotes.toString()} ({noPercent}%)</span>
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            style={{ width: `${yesPercent}%` }}
            className="bg-emerald-500 transition-all duration-500"
          ></div>
          <div
            style={{ width: `${noPercent}%` }}
            className="bg-rose-500 transition-all duration-500"
          ></div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Total votes: {totalVotes} (Quorum: {minQuorum})</span>
          <span>{timeRemaining.text}</span>
        </div>
      </div>

      {/* Bottom Actions & Execution */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Proposer Info */}
        <div className="text-[11px] text-slate-400">
          Proposed by <span className="font-mono text-slate-300">{shortenAddress(proposer)}</span> • {formatTimestamp(createdAt)}
        </div>

        {/* Voting & Execution Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* Active Voting Controls */}
          {status === "ACTIVE" && (
            <>
              {userVoted ? (
                <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  <span>You voted {userVoteChoice ? "YES" : "NO"}</span>
                </div>
              ) : !account ? (
                <span className="text-[11px] text-slate-400 italic">Connect wallet to vote</span>
              ) : isMember ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onVote(id, true)}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
                  >
                    Vote YES
                  </button>
                  <button
                    onClick={() => onVote(id, false)}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
                  >
                    Vote NO
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 italic">Join club to vote</span>
              )}
            </>
          )}

          {/* Execute Proposal Button */}
          {status === "PASSED (READY)" && (
            <button
              onClick={() => onExecute(id)}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 animate-pulse"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {pTypeNum === 0
                  ? "Execute Payout & Disburse Funds"
                  : pTypeNum === 1
                  ? "Execute Member Addition"
                  : "Execute Member Removal"}
              </span>
            </button>
          )}

          {status === "EXECUTED" && (
            <span className="text-xs text-purple-400 flex items-center space-x-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Disbursed &amp; Logged</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
