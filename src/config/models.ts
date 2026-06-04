export interface ModelConfig {
  id: string;
  name: string;
  contextWindow: number;
}

export interface ModelProvider {
  name: string;
  models: ModelConfig[];
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    name: "OpenAI",
    models: [
      { id: "openai/gpt-4.1", name: "GPT-4.1", contextWindow: 1047576 },
      { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", contextWindow: 1047576 },
      { id: "openai/gpt-4.1-nano", name: "GPT-4.1 Nano", contextWindow: 1047576 },
      { id: "openai/gpt-4o", name: "GPT-4o", contextWindow: 128000 },
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000 },
    ],
  },
  {
    name: "DeepSeek",
    models: [
      { id: "deepseek/DeepSeek-R1", name: "DeepSeek R1", contextWindow: 64000 },
    ],
  },
  {
    name: "xAI",
    models: [
      { id: "xai/grok-3", name: "Grok 3", contextWindow: 131072 },
    ],
  },
];

export const ALL_MODELS: ModelConfig[] = MODEL_PROVIDERS.flatMap((p) => p.models);

export const DEFAULT_MODEL = "openai/gpt-4.1-mini";

export function getModelById(id: string): ModelConfig | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}

export function getModelDisplayName(id: string): string {
  const model = getModelById(id);
  return model ? model.name : id;
}
