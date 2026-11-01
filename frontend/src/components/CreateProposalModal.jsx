import React, { useState } from "react";
import { X, PlusCircle, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { ethers } from "ethers";

export default function CreateProposalModal({ isOpen, onClose, onSubmit, treasuryBalance, isLoading }) {
  const [pType, setPType] = useState(0); // 0 = SPENDING, 1 = ADD_MEMBER, 2 = REMOVE_MEMBER
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amountEth, setAmountEth] = useState("");
  const [duration, setDuration] = useState(120); // default 2 minutes (120s) for rapid demo/hackathon judging!
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please provide a proposal title.");
      return;
    }

    if (!recipient.trim() || !ethers.isAddress(recipient.trim())) {
      setError("Please provide a valid Ethereum recipient address (0x...).");
      return;
    }

    let parsedAmount = 0n;
    if (pType === 0) {
      if (!amountEth || parseFloat(amountEth) <= 0) {
        setError("Please enter a valid ETH amount greater than zero.");
        return;
      }
      try {
        parsedAmount = ethers.parseEther(amountEth);
        if (parsedAmount > treasuryBalance) {
          setError("Proposed spending amount exceeds current treasury holdings.");
          return;
        }
      } catch (err) {
        setError("Invalid ETH amount formatted.");
        return;
      }
    }

    onSubmit({
      pType,
      recipient: recipient.trim(),
      amount: parsedAmount,
      title: title.trim(),
      description: description.trim(),
      durationInSeconds: duration,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-700/80 p-6 sm:p-8 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create On-Chain Proposal</h2>
              <p className="text-xs text-slate-400">Enforced by immutable smart contract rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Proposal Type Selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Proposal Action Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 0, label: "💸 Spending" },
                { type: 1, label: "➕ Add Member" },
                { type: 2, label: "➖ Remove Member" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setPType(item.type)}
                  className={`py-2 px-3 rounded-xl border text-center font-medium transition ${
                    pType === item.type
                      ? "bg-teal-500/20 border-teal-500/50 text-teal-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proposal Title */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Proposal Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Hackathon Venue Audio & Projector Rental"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Recipient / Target Address */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              {pType === 0 ? "Vendor / Payee Address" : "Candidate Member Address"}
            </label>
            <input
              type="text"
              required
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Amount (only for SPENDING) */}
          {pType === 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300">Amount (ETH)</label>
                <span className="text-[11px] text-slate-400">
                  Treasury balance: {ethers.formatEther(treasuryBalance || 0n)} ETH
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.05"
                value={amountEth}
                onChange={(e) => setAmountEth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Voting Duration */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Voting Period Window</span>
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
            >
              <option value={60}>1 Minute (Fast Test &amp; Demo)</option>
              <option value={120}>2 Minutes (Judge Showcase)</option>
              <option value={600}>10 Minutes</option>
              <option value={3600}>1 Hour</option>
              <option value={86400}>24 Hours (Standard)</option>
            </select>
          </div>

          {/* Description & Invoice Reference */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Description &amp; Stated Purpose</label>
            <textarea
              rows={3}
              placeholder="Detail what this expense is for, itemized breakdown, or receipt link..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {isLoading ? "Submitting to Blockchain..." : "Publish On-Chain Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
