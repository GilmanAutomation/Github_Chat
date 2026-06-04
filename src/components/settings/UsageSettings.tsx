"use client";

import { useState, useEffect } from "react";
import { BarChart3, Loader2, RefreshCw, MessageSquare, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface ModelUsageData {
  model: string;
  name: string;
  provider: string;
  messagesSent: number;
  inputTokens: number;
  outputTokens: number;
  updatedAt: string | null;
}

export function UsageSettings() {
  const [usages, setUsages] = useState<ModelUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [hideZeroUsage, setHideZeroUsage] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/usage");
      if (res.ok) {
        setUsages(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all model usage statistics? This action cannot be undone.")) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/settings/usage", {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchUsage();
      }
    } catch (error) {
      console.error("Failed to reset usage:", error);
    }
    setResetting(false);
  };

  const totalMessages = usages.reduce((sum, u) => sum + u.messagesSent, 0);
  const totalInputTokens = usages.reduce((sum, u) => sum + u.inputTokens, 0);
  const totalOutputTokens = usages.reduce((sum, u) => sum + u.outputTokens, 0);

  const displayedUsages = hideZeroUsage
    ? usages.filter((u) => u.messagesSent > 0)
    : usages;

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="usage-loading">
        <Loader2 size={32} className="animate-spin text-accent" />
        <span>Loading usage statistics...</span>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <div className="usage-header-row">
        <h3 className="settings-section-title">
          <BarChart3 size={20} />
          Model Usage Statistics
        </h3>
        <button
          onClick={handleReset}
          className="btn btn-danger-subtle btn-sm"
          disabled={resetting || totalMessages === 0}
          title="Reset statistics"
        >
          {resetting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          <span>Reset All</span>
        </button>
      </div>

      <p className="settings-section-desc">
        Track your API key consumption. Statistics are aggregated on stream completion.
      </p>

      {/* Summary Cards */}
      <div className="usage-summary-grid">
        <div className="usage-summary-card">
          <div className="usage-card-icon messages">
            <MessageSquare size={20} />
          </div>
          <div className="usage-card-content">
            <span className="usage-card-label">Messages Sent</span>
            <span className="usage-card-val">{formatNumber(totalMessages)}</span>
          </div>
        </div>

        <div className="usage-summary-card">
          <div className="usage-card-icon input-tokens">
            <ArrowDownLeft size={20} />
          </div>
          <div className="usage-card-content">
            <span className="usage-card-label">Input Tokens</span>
            <span className="usage-card-val">{formatNumber(totalInputTokens)}</span>
          </div>
        </div>

        <div className="usage-summary-card">
          <div className="usage-card-icon output-tokens">
            <ArrowUpRight size={20} />
          </div>
          <div className="usage-card-content">
            <span className="usage-card-label">Output Tokens</span>
            <span className="usage-card-val">{formatNumber(totalOutputTokens)}</span>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="usage-filters">
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={hideZeroUsage}
            onChange={(e) => setHideZeroUsage(e.target.checked)}
          />
          <span className="checkmark"></span>
          <span className="checkbox-label">Hide inactive models</span>
        </label>
      </div>

      {/* Usage Table */}
      <div className="usage-table-wrapper">
        {displayedUsages.length === 0 ? (
          <div className="usage-empty-state">
            <span>No usage statistics available. Send some messages first!</span>
          </div>
        ) : (
          <table className="usage-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Provider</th>
                <th className="text-right">Messages</th>
                <th className="text-right">Input Tokens</th>
                <th className="text-right">Output Tokens</th>
                <th>Last Used</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsages.map((usage) => (
                <tr key={usage.model} className={usage.messagesSent > 0 ? "active-row" : "inactive-row"}>
                  <td className="font-semibold">{usage.name}</td>
                  <td>
                    <span className={`provider-badge ${usage.provider.toLowerCase()}`}>
                      {usage.provider}
                    </span>
                  </td>
                  <td className="text-right font-mono">{formatNumber(usage.messagesSent)}</td>
                  <td className="text-right font-mono text-secondary">{formatNumber(usage.inputTokens)}</td>
                  <td className="text-right font-mono text-secondary">{formatNumber(usage.outputTokens)}</td>
                  <td className="text-secondary font-sm">{formatDate(usage.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
