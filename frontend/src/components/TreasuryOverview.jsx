import React from "react";
import { Coins, ArrowDownLeft, ArrowUpRight, Users, Vote, PlusCircle, ShieldAlert, Sparkles } from "lucide-react";
import { formatEth } from "../utils/formatters";

export default function TreasuryOverview({
  summary,
  clubInfo,
  onOpenDeposit,
  onOpenCreateProposal,
  isMember,
  account,
}) {
  const { balance, totalInflow, totalOutflow, memberCount, proposalCount } = summary;

  return (
    <div className="space-y-6">
      {/* Club Banner & Security Invariants Callout */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/40 to-teal-950/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verifiable Trustless On-Chain Governance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {clubInfo.name || "Trustworthy Club Treasury"}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {clubInfo.description ||
                "A decentralized club treasury ensuring all shared funds are transparent, accountable, and mathematically immune to individual abuse or backdoors."}
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={onOpenDeposit}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2"
            >
              <Coins className="w-4 h-4" />
              <span>Contribute ETH</span>
            </button>
            <button
              onClick={onOpenCreateProposal}
              disabled={!isMember}
              title={!isMember ? "Only verified club members can create proposals" : ""}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2 border ${
                isMember
                  ? "bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-600 shadow-md"
                  : "bg-slate-900/50 text-slate-500 border-slate-800/80 cursor-not-allowed"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Proposal</span>
            </button>
          </div>
        </div>

        {/* Invariant Safety Badges */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Zero Backdoors: No admin sweep or drain</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>Non-Reentrant &amp; Checks-Effects-Interactions</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>Invariant: Payouts require majority vote</span>
          </div>
        </div>
      </div>

      {/* 4 Financial & Governance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Treasury Balance */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-teal-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Treasury Holdings</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatEth(balance)} <span className="text-teal-400 text-base font-semibold">ETH</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Current balance locked in smart contract
          </div>
        </div>

        {/* Total Inflow */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Inflow</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatEth(totalInflow)} <span className="text-emerald-400 text-base font-semibold">ETH</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/90 flex items-center gap-1 font-medium">
            <span>Dues, sponsorships &amp; donations</span>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Approved Outflows</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatEth(totalOutflow)} <span className="text-purple-400 text-base font-semibold">ETH</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            100% verified by on-chain votes
          </div>
        </div>

        {/* Active Members & Proposals */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-sky-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Club Participation</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {memberCount.toString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">members</span>
            <span className="text-slate-600">/</span>
            <span className="text-lg font-bold text-sky-400">{proposalCount.toString()}</span>
            <span className="text-xs text-slate-400 font-medium">proposals</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Democratic voting participants
          </div>
        </div>
      </div>
    </div>
  );
}
