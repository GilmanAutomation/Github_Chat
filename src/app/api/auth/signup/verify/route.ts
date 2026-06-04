import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyOtpSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    // 5 attempts per minute to verify OTP
    const { success } = rateLimit(`signup-verify:${ip}`, 5, 60000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;

    // Find verification record
    const record = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!record) {
      return NextResponse.json(
        { error: "No verification request found for this email address. Please sign up again." },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check code match
    if (record.otp !== otp) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Check if the user was somehow registered in the meantime
    const existingUser = await prisma.user.findUnique({
      where: { username: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    // Create user and default settings inside a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: email,
          passwordHash: record.passwordHash,
          settings: {
            create: {
              defaultModel: "openai/gpt-4.1-mini",
              temperature: 0.7,
              maxTokens: 4096,
              theme: "system",
              systemPrompt: "You are a helpful assistant.",
            },
          },
        },
      });

      // Delete the OTP verification record
      await tx.otpVerification.delete({
        where: { email },
      });

      return newUser;
    });

    // Create session
    const session = await getSession();
    session.userId = user.id;
    session.username = user.username; // this is the email address
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.username },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
