import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { importConversationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = importConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid import format", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, model, messages } = parsed.data;

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.userId,
        title,
        model,
        messages: {
          create: messages.map((m) => ({
            role: m.role,
            content: m.content,
            createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
          })),
        },
      },
      include: { messages: true },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
