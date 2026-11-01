import React, { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, Search, ExternalLink, Calendar, FileText } from "lucide-react";
import { formatEth, shortenAddress, formatTimestamp } from "../utils/formatters";

export default function AuditTrail({ outflows, inflows, contractAddress }) {
  const [activeTab, setActiveTab] = useState("outflows"); // 'outflows' | 'inflows'
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOutflows = outflows.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.purpose || "").toLowerCase().includes(term) ||
      (item.recipient || "").toLowerCase().includes(term) ||
      (item.proposalId !== undefined ? item.proposalId.toString() : "").includes(term)
    );
  });

  const filteredInflows = inflows.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.note || "").toLowerCase().includes(term) ||
      (item.sender || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="glass-panel rounded-3xl border border-slate-800/80 p-6 sm:p-8 space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Public Treasury Ledger &amp; Audit Trail</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
              100% On-Chain
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every wei entering or leaving the treasury is permanently registered and linked to an on-chain decision.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("outflows")}
            className={`px-4 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeTab === "outflows"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Outflows ({outflows.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("inflows")}
            className={`px-4 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
              activeTab === "inflows"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Inflows ({inflows.length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Filter by address, title, or stated purpose..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Table Data */}
      {activeTab === "outflows" ? (
        <div className="overflow-x-auto">
          {filteredOutflows.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No approved treasury outflows recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-3">Proposal</th>
                  <th className="pb-3 px-3">Stated Purpose</th>
                  <th className="pb-3 px-3">Recipient Address</th>
                  <th className="pb-3 px-3 text-right">Amount (ETH)</th>
                  <th className="pb-3 px-3 text-right">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOutflows.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3 font-mono text-teal-400 font-bold">
                      #{item.proposalId.toString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">
                      {item.purpose}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {shortenAddress(item.recipient)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-purple-400 font-mono">
                      -{formatEth(item.amount)} ETH
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {formatTimestamp(item.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          {filteredInflows.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No treasury inflows recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-3">Contributor / Sender</th>
                  <th className="pb-3 px-3">Deposit Note / Memo</th>
                  <th className="pb-3 px-3 text-right">Amount (ETH)</th>
                  <th className="pb-3 px-3 text-right">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInflows.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {shortenAddress(item.sender)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">
                      {item.note || "General Contribution"}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-400 font-mono">
                      +{formatEth(item.amount)} ETH
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {formatTimestamp(item.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
