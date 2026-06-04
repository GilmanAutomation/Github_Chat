"use client";

import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, Trash2, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";

export function ApiKeySettings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setHasKey(data.hasApiKey);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "API key saved successfully!" });
        setHasKey(true);
        setApiKey("");
      } else {
        setMessage({ type: "error", text: "Failed to save API key" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test-key", { method: "POST" });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message || data.error });
    } catch {
      setTestResult({ success: false, message: "Network error" });
    }
    setTesting(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your API key?")) return;
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (res.ok) {
        setHasKey(false);
        setMessage({ type: "success", text: "API key deleted" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete API key" });
    }
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">
        <ShieldCheck size={20} />
        API Key
      </h3>
      <p className="settings-section-desc">
        Your GitHub Personal Access Token for GitHub Models API. The key is encrypted
        and never exposed to the browser.
      </p>

      <div className="settings-field">
        <label className="settings-label">GitHub Token (PAT)</label>
        <div className="api-key-input-group">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "••••••••••••••••••••" : "ghp_xxxxxxxxxxxxxxxxxxxx"}
            className="settings-input"
          />
          <button onClick={() => setShowKey(!showKey)} className="icon-btn" title={showKey ? "Hide" : "Show"}>
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {hasKey && (
        <div className="api-key-status">
          <ShieldCheck size={16} className="text-green-500" />
          <span className="text-green-500 text-sm">API key is configured</span>
        </div>
      )}

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {testResult && (
        <div className={`settings-message ${testResult.success ? "success" : "error"}`}>
          {testResult.success ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
          {testResult.message}
        </div>
      )}

      <div className="settings-actions">
        <button onClick={handleSave} className="btn btn-primary" disabled={saving || !apiKey.trim()}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {apiKey.trim() ? (hasKey ? "Update Key" : "Save Key") : "Save Key"}
        </button>
        {hasKey && (
          <>
            <button onClick={handleTest} className="btn btn-secondary" disabled={testing}>
              {testing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Test Connection
            </button>
            <button onClick={handleDelete} className="btn btn-danger">
              <Trash2 size={16} />
              Delete Key
            </button>
          </>
        )}
      </div>
    </div>
  );
}
