import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getModelDisplayName } from "@/config/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (format === "markdown") {
      const modelName = getModelDisplayName(conversation.model);
      let markdown = `# ${conversation.title}\n\n`;
      markdown += `**Model:** ${modelName}\n`;
      markdown += `**Date:** ${conversation.createdAt.toISOString()}\n\n---\n\n`;

      for (const msg of conversation.messages) {
        const role = msg.role === "user" ? "**You**" : `**${modelName}**`;
        const time = new Date(msg.createdAt).toLocaleString();
        markdown += `### ${role} — ${time}\n\n${msg.content}\n\n---\n\n`;
      }

      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, "_")}.md"`,
        },
      });
    }

    // JSON format
    const exportData = {
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, "_")}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
