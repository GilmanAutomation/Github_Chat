"use client";

import { MODEL_PROVIDERS } from "@/config/models";
import { useChatStore } from "@/stores/chatStore";
import { ChevronDown } from "lucide-react";

export function ModelSelector() {
  const { selectedModel, setSelectedModel, isStreaming } = useChatStore();

  return (
    <div className="model-selector">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        disabled={isStreaming}
        className="model-selector-select"
      >
        {MODEL_PROVIDERS.map((provider) => (
          <optgroup key={provider.name} label={provider.name}>
            {provider.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({(model.contextWindow / 1000).toFixed(0)}K)
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown size={14} className="model-selector-chevron" />
    </div>
  );
}

