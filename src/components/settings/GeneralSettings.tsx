"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Palette } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { MODEL_PROVIDERS } from "@/config/models";

export function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  const [defaultModel, setDefaultModel] = useState("openai/gpt-4.1-mini");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setDefaultModel(data.defaultModel);
      if (data.theme && data.theme !== "system") {
        setTheme(data.theme);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultModel, theme }),
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
        <Palette size={20} />
        General
      </h3>

      <div className="settings-field">
        <label className="settings-label">Theme</label>
        <div className="theme-selector">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`theme-option ${theme === t ? "active" : ""}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-field">
        <label className="settings-label">Default Model</label>
        <select
          value={defaultModel}
          onChange={(e) => setDefaultModel(e.target.value)}
          className="settings-select"
        >
          {MODEL_PROVIDERS.map((provider) => (
            <optgroup key={provider.name} label={provider.name}>
              {provider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
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
