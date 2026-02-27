import { v } from "convex/values";
import { internalAction } from "./_generated/server"; // ✅ internalAction فقط

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const sendVerificationEmail = internalAction({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (_ctx, args) => {
    const { email, code } = args;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AgriSense <onboarding@resend.dev>",
        to: [email],
        subject: "Verify your AgriSense account",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Inter', sans-serif; background: #f7fdf3; padding: 40px 20px; }
                .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                h1 { color: #111827; font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 8px; }
                p { color: #6b7280; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 24px; }
                .code { background: #f3f4f6; padding: 16px; border-radius: 12px; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: 8px; color: #16a34a; margin: 24px 0; }
                .footer { text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Verify your email</h1>
                <p>Enter this code in the AgriSense app to verify your email address.</p>
                <div class="code">${code}</div>
                <p>This code expires in 5 minutes.</p>
                <div class="footer">
                  <p>If you didn't request this, you can ignore this email.</p>
                  <p>© 2026 AgriSense. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      throw new Error("Failed to send email");
    }

    return { success: true };
  },
});

export const sendPasswordResetEmail = internalAction({
  // ✅ كان action خطأ
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (_ctx, args) => {
    const { email, code } = args;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AgriSense <onboarding@resend.dev>",
        to: [email],
        subject: "Reset your AgriSense password",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Inter', sans-serif; background: #f7fdf3; padding: 40px 20px; }
                .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                h1 { color: #111827; font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 8px; }
                p { color: #6b7280; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 24px; }
                .code { background: #f3f4f6; padding: 16px; border-radius: 12px; font-size: 32px; font-weight: 700; text-align: center; letter-spacing: 8px; color: #16a34a; margin: 24px 0; }
                .footer { text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Reset your password</h1>
                <p>Enter this code in the AgriSense app to reset your password.</p>
                <div class="code">${code}</div>
                <p>This code expires in 15 minutes.</p>
                <div class="footer">
                  <p>If you didn't request this, you can ignore this email.</p>
                  <p>© 2026 AgriSense. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      throw new Error("Failed to send email");
    }

    return { success: true };
  },
});
