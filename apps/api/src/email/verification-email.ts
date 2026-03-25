import { env } from "../config/env.js";
import { sendTransactionalEmail } from "./send-email.js";

export function verificationLinkUrl(rawToken: string): string {
  const base = env.APP_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/verify-email?token=${encodeURIComponent(rawToken)}`;
}

export async function sendVerificationEmail(to: string, rawToken: string): Promise<void> {
  const url = verificationLinkUrl(rawToken);
  const subject = "Verify your Keymaker account";
  const html = `
    <p>Thanks for signing up. Verify your email to start using Keymaker.</p>
    <p><a href="${url}">Verify email</a></p>
    <p style="color:#666;font-size:12px;">This link expires in 24 hours. If you did not create an account, you can ignore this message.</p>
  `.trim();
  const textFallback = `Verify your email: ${url}`;
  await sendTransactionalEmail({ to, subject, html, textFallback });
}
