import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { createGitHubModelsClient } from "@/lib/githubModels";
import { isUnexpected } from "@azure-rest/ai-inference";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: user.userId },
    });

    if (!settings?.apiKeyEncrypted || !settings?.apiKeyIv || !settings?.apiKeyTag) {
      return NextResponse.json(
        { error: "No API key configured" },
        { status: 400 }
      );
    }

    const apiKey = decrypt(
      settings.apiKeyEncrypted,
      settings.apiKeyIv,
      settings.apiKeyTag
    );

    const client = createGitHubModelsClient(apiKey);

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [{ role: "user", content: "Say 'OK'" }],
        model: "openai/gpt-4.1-nano",
        max_tokens: 5,
      },
    });

    if (isUnexpected(response)) {
      return NextResponse.json(
        { success: false, error: "API key is invalid or unauthorized" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "API key is valid" });
  } catch (error) {
    console.error("Test key error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate API key" },
      { status: 500 }
    );
  }
}
