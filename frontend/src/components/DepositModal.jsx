import React, { useState } from "react";
import { X, Coins, Sparkles, AlertCircle } from "lucide-react";
import { ethers } from "ethers";

export default function DepositModal({ isOpen, onClose, onDeposit, isLoading }) {
  const [amount, setAmount] = useState("0.05");
  const [note, setNote] = useState("MERAZ 7.0 Club Support");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a contribution amount greater than 0 ETH.");
      return;
    }

    try {
      const parsed = ethers.parseEther(amount);
      onDeposit({ amount: parsed, note: note.trim() || "Community Contribution" });
    } catch {
      setError("Invalid ETH amount entered.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-slate-700/80 p-6 sm:p-8 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Contribute to Treasury</h2>
              <p className="text-xs text-slate-400">Open to students, alumni, and sponsors</p>
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
          {/* Quick Amount Presets */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Contribution Amount (ETH)</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {["0.01", "0.05", "0.1", "0.5"].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-1.5 rounded-xl border text-center font-mono font-semibold transition ${
                    amount === preset
                      ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0.05"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Stated Purpose / Note */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Deposit Note / Memo (Logged on-chain)</label>
            <input
              type="text"
              placeholder="e.g. Alumni donation for hackathon prizes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {isLoading ? "Broadcasting Deposit..." : `Send ${amount || "0"} ETH to Treasury`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
