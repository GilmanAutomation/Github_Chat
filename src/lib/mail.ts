import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

interface SendMailResult {
  success: boolean;
  mocked: boolean;
  error?: string;
}

export async function sendOtpEmail(email: string, otp: string): Promise<SendMailResult> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"GitHub Models Chat" <noreply@githubmodelschat.local>`;

  const isConfigured = host && port && user && pass;

  if (!isConfigured) {
    // Print to server console for developers
    const timestamp = new Date().toLocaleTimeString();
    console.log("\n==================================================");
    console.log(`[${timestamp}] ✉️  [MOCK EMAIL SENDER]`);
    console.log(`Recipient: ${email}`);
    console.log(`Verification Code (OTP): ${otp}`);
    console.log("--------------------------------------------------");
    console.log("SMTP is not configured in .env. Using mock mode.");
    console.log("Check the console or otp.log in the project root.");
    console.log("==================================================\n");

    // Write to otp.log in project root
    try {
      const logPath = path.join(process.cwd(), "otp.log");
      const logLine = `[${new Date().toISOString()}] To: ${email} | OTP: ${otp} | Status: Mocked\n`;
      fs.appendFileSync(logPath, logLine, "utf8");
    } catch (err: any) {
      console.error("Failed to write OTP to log file:", err.message);
    }

    return { success: true, mocked: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: port === "465", // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from,
      to: email,
      subject: `Your Verification Code: ${otp}`,
      text: `Hello,\n\nYour 6-digit verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nGitHub Models Chat Team`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background-color: #f8f9fb; border-radius: 12px; border: 1px solid #e0e3e8;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">GitHub Models Chat</h2>
          <p style="font-size: 16px; color: #1a1c20; line-height: 1.5;">Hello,</p>
          <p style="font-size: 16px; color: #1a1c20; line-height: 1.5;">Please use the following 6-digit verification code to complete your registration:</p>
          <div style="background-color: #ffffff; border: 1px solid #e0e3e8; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #5f6368; line-height: 1.5;">This code will expire in <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e3e8; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9aa0a6; text-align: center; margin: 0;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, mocked: false };
  } catch (error: any) {
    console.error("Failed to send real email:", error);
    return { success: false, mocked: false, error: error.message };
  }
}
