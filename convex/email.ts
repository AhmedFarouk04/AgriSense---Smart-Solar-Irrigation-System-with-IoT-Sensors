"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = internalAction({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (_ctx, args) => {
    const { email, code } = args;

    console.log("🔵 Starting email send process via SMTP");
    console.log("📧 Email:", email);
    console.log("🔑 Code:", code);
    console.log("📧 Using email account:", process.env.EMAIL_USER);
    console.log("📧 Email account exists:", !!process.env.EMAIL_USER);
    console.log("🔑 Password exists:", !!process.env.EMAIL_PASS);

    try {
      // إعداد البريد الإلكتروني
      const mailOptions = {
        from: `"AgriSense" <${process.env.EMAIL_USER}>`,
        to: email,
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
      };

      const info = await transporter.sendMail(mailOptions);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      const err = error as any;

      // تفاصيل أكثر عن الخطأ
      if (err.code === "EAUTH") {
        console.error(
          "❌ Authentication failed - check EMAIL_USER and EMAIL_PASS",
        );
      } else if (err.code === "ESOCKET") {
      } else if (err.code === "ECONNREFUSED") {
      }

      throw new Error(
        `Failed to send email: ${err.message || "Unknown error"}`,
      );
    }
  },
});

export const sendPasswordResetEmail = internalAction({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (_ctx, args) => {
    const { email, code } = args;

    try {
      const mailOptions = {
        from: `"AgriSense" <${process.env.EMAIL_USER}>`,
        to: email,
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
      };

      console.log("📨 Sending password reset email...");
      const info = await transporter.sendMail(mailOptions);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      const err = error as any;
      throw new Error(
        `Failed to send email: ${err.message || "Unknown error"}`,
      );
    }
  },
});

export const sendCriticalAlertEmail = internalAction({
  args: {
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    const { email, subject, message } = args;
    try {
      const mailOptions = {
        from: `"AgriSense Alerts" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: `
          <html>
            <body style="font-family: Inter, Arial, sans-serif; background:#f6faf6; padding:24px;">
              <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;border:1px solid #e5efe5;">
                <h2 style="margin:0 0 12px;color:#b91c1c;">Critical Alert</h2>
                <p style="margin:0 0 14px;color:#111827;">${message}</p>
                <p style="margin:0;color:#6b7280;font-size:13px;">This message was generated automatically by AgriSense.</p>
              </div>
            </body>
          </html>
        `,
      };
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      throw new Error(`Failed to send critical alert email: ${error?.message ?? "unknown error"}`);
    }
  },
});
