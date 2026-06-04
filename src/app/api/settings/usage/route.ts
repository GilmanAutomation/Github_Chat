import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MODEL_PROVIDERS } from "@/config/models";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usages = await prisma.modelUsage.findMany({
      where: { userId: user.userId },
    });

    // Map all configured models in the app
    const allModelsMapped = MODEL_PROVIDERS.flatMap((provider) =>
      provider.models.map((model) => {
        const usage = usages.find((u) => u.model === model.id);
        return {
          model: model.id,
          name: model.name,
          provider: provider.name,
          messagesSent: usage?.messagesSent || 0,
          inputTokens: usage?.inputTokens || 0,
          outputTokens: usage?.outputTokens || 0,
          updatedAt: usage?.updatedAt || null,
        };
      })
    );

    return NextResponse.json(allModelsMapped);
  } catch (error) {
    console.error("Usage GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.modelUsage.deleteMany({
      where: { userId: user.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Usage DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
