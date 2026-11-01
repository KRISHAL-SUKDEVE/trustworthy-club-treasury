import React, { useState } from "react";
import { ShieldCheck, Wallet, ChevronDown, CheckCircle2, UserCheck, UserPlus, ExternalLink, Settings } from "lucide-react";
import { shortenAddress } from "../utils/formatters";

export default function Navbar({
  account,
  network,
  isMember,
  balance,
  onConnect,
  onJoinClub,
  membershipFee,
  contractAddress,
  onUpdateContractAddress,
  isLoading,
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [tempAddress, setTempAddress] = useState(contractAddress);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black text-xl">
            🏛️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-teal-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
                ClubTreasury
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                MERAZ 7.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Decentralized &amp; Democratic Campus Treasury</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Network Badge */}
          {network && (
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">{network}</span>
            </div>
          )}

          {/* Contract Address Config Toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Configure Deployed Contract Address"
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all text-xs flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">{shortenAddress(contractAddress)}</span>
          </button>

          {/* Membership Badge / Join Button */}
          {account && (
            <>
              {isMember ? (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Member</span>
                </div>
              ) : (
                <button
                  onClick={onJoinClub}
                  disabled={isLoading}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-semibold transition-all shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Join Club ({membershipFee || "0.005"} ETH)</span>
                </button>
              )}
            </>
          )}

          {/* Wallet Connect Button */}
          {account ? (
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-mono shadow-inner">
              <Wallet className="w-4 h-4 text-teal-400" />
              <span>{shortenAddress(account)}</span>
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-teal-500/25 flex items-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Contract Address Config Drawer */}
      {showConfig && (
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-teal-400">Deployed Contract Address:</span>
              <span className="text-slate-400">Point frontend to any testnet or local deployment</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="0x..."
                className="w-full sm:w-96 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={() => {
                  onUpdateContractAddress(tempAddress);
                  setShowConfig(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
