"use client";

import { useState } from "react";
import { ArrowLeft, Key, Palette, Sliders, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { AdvancedSettings } from "@/components/settings/AdvancedSettings";
import { UsageSettings } from "@/components/settings/UsageSettings";

type Tab = "general" | "api-key" | "advanced" | "usage";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const router = useRouter();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Palette size={18} /> },
    { id: "api-key", label: "API Key", icon: <Key size={18} /> },
    { id: "advanced", label: "Advanced", icon: <Sliders size={18} /> },
    { id: "usage", label: "Usage Stats", icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button onClick={() => router.push("/")} className="settings-back-btn">
          <ArrowLeft size={20} />
          <span>Back to Chat</span>
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-panel">
          {activeTab === "general" && <GeneralSettings />}
          {activeTab === "api-key" && <ApiKeySettings />}
          {activeTab === "advanced" && <AdvancedSettings />}
          {activeTab === "usage" && <UsageSettings />}
        </div>
      </div>
    </div>
  );
}
