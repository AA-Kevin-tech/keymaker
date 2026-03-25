import { env } from "../config/env.js";

/**
 * Sends a transactional email via Resend. In development without RESEND_API_KEY, logs instead.
 * Production requires RESEND_API_KEY when sending real verification mail.
 */
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  textFallback?: string;
}): Promise<void> {
  const { to, subject, html, textFallback } = params;

  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required to send email in production");
    }
    console.info(`[email] To: ${to}\nSubject: ${subject}\n${textFallback ?? html.replace(/<[^>]+>/g, " ")}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send email: ${res.status} ${err}`);
  }
}
