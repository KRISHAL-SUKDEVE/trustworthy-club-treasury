import { ethers } from "ethers";

export function shortenAddress(address) {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatEth(wei, decimals = 4) {
  if (!wei && wei !== 0n) return "0.0000";
  try {
    const formatted = ethers.formatEther(wei);
    const num = parseFloat(formatted);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    });
  } catch {
    return "0.0000";
  }
}

export function formatTimestamp(seconds) {
  if (!seconds) return "-";
  const num = typeof seconds === "bigint" ? Number(seconds) : Number(seconds);
  if (num === 0) return "-";
  return new Date(num * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTimeRemaining(deadlineSeconds) {
  const deadline = typeof deadlineSeconds === "bigint" ? Number(deadlineSeconds) : Number(deadlineSeconds);
  const now = Math.floor(Date.now() / 1000);
  const diff = deadline - now;
  
  if (diff <= 0) return { expired: true, text: "Voting Closed" };
  
  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return { expired: false, text: `${days}d ${hours % 24}h left` };
  if (hours > 0) return { expired: false, text: `${hours}h ${minutes % 60}m left` };
  return { expired: false, text: `${minutes}m ${diff % 60}s left` };
}
