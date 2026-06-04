import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const GITHUB_MODELS_ENDPOINT = "https://models.github.ai/inference";

export function createGitHubModelsClient(apiKey: string) {
  return ModelClient(
    GITHUB_MODELS_ENDPOINT,
    new AzureKeyCredential(apiKey)
  );
}

export { GITHUB_MODELS_ENDPOINT };
