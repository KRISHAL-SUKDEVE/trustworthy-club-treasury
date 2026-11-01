import React from "react";
import { Users, UserCheck, Shield, Award, UserPlus } from "lucide-react";
import { shortenAddress } from "../utils/formatters";

export default function MembersDirectory({ members, isMember, onJoinClub, membershipFee, account, isLoading }) {
  return (
    <div className="glass-panel rounded-3xl border border-slate-800/80 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Club Governance &amp; Members</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
              {members.length} Voting Members
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Democratic participants holding voting rights on all treasury expenditures and additions.
          </p>
        </div>

        {!isMember && (
          <button
            onClick={onJoinClub}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Join with {membershipFee || "0.005"} ETH</span>
          </button>
        )}
      </div>

      {/* Rules Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-teal-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>1 Member = 1 Vote</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Every member has equal voting weight. Whales cannot buy excess governance power.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-sky-400 font-bold">
            <UserCheck className="w-4 h-4" />
            <span>Transparent Onboarding</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Anyone can join by paying dues (which directly fund the treasury), or via member vote.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-purple-400 font-bold">
            <Award className="w-4 h-4" />
            <span>Autonomous Execution</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            No president or treasurer holds keys to the safe. Rules are enforced strictly by code.
          </p>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {members.map((addr, idx) => {
          const isCurrentUser = account && addr.toLowerCase() === account.toLowerCase();
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                isCurrentUser
                  ? "bg-teal-500/10 border-teal-500/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                  {addr.substring(2, 4).toUpperCase()}
                </div>
                <div>
                  <div className="font-mono text-xs font-semibold text-white">
                    {shortenAddress(addr)}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {idx === 0 ? "Genesis Founder" : `Member #${idx + 1}`}
                  </span>
                </div>
              </div>
              {isCurrentUser && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  You
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
