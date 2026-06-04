import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";
import { sendOtpEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    // 5 attempts per 2 minutes for sending OTP
    const { success } = rateLimit(`signup-otp:${ip}`, 5, 120000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before requesting another verification code." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check if user already exists (where username is the email)
    const existingUser = await prisma.user.findUnique({
      where: { username: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    // Generate a 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Code expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save/upsert OTP record
    await prisma.otpVerification.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        otp,
        expiresAt,
      },
      update: {
        passwordHash,
        otp,
        expiresAt,
      },
    });

    // Send the email
    const mailResult = await sendOtpEmail(email, otp);

    if (!mailResult.success) {
      return NextResponse.json(
        { error: `Failed to send verification email: ${mailResult.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully.",
      mocked: mailResult.mocked,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
