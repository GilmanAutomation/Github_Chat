"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Sliders } from "lucide-react";

export function AdvancedSettings() {
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setTemperature(data.temperature);
      setMaxTokens(data.maxTokens);
      if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature, maxTokens, systemPrompt }),
      });
      if (res.ok) {
        setMessage("Settings saved!");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">
        <Sliders size={20} />
        Advanced
      </h3>

      <div className="settings-field">
        <label className="settings-label">
          Temperature: <span className="text-accent font-mono">{temperature.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="settings-range"
        />
        <div className="settings-range-labels">
          <span>Precise (0)</span>
          <span>Creative (2)</span>
        </div>
      </div>

      <div className="settings-field">
        <label className="settings-label">Max Tokens</label>
        <input
          type="number"
          min="1"
          max="128000"
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
          className="settings-input"
        />
      </div>

      <div className="settings-field">
        <label className="settings-label">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="settings-textarea"
          rows={4}
          placeholder="You are a helpful assistant."
        />
      </div>

      {message && <div className="settings-message success">{message}</div>}

      <div className="settings-actions">
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
