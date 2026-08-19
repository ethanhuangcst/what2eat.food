import { type Locale } from "../core/locales";
import { setPasswordUrl } from "./public-url";

const outbox: { to: string; subject: string; text: string; html: string }[] = [];

export function getMailOutbox() {
  return outbox;
}

export function clearMailOutbox() {
  outbox.length = 0;
}

export function resetMailContent(locale: Locale, token: string) {
  const url = setPasswordUrl(token);
  return {
    subject: locale === "CN" ? "重置 what2eat 密码" : "Reset your what2eat password",
    text: `Use this link to set a new password: ${url}`,
    html: `<p>Use this link to set a new password:</p><p><a href="${url}">${url}</a></p>`,
  };
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  if (process.env.FEATURE_EMAIL === "true" && process.env.RESEND_API_KEY) {
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@what2eat.food";
    const from = `what2eat <${fromEmail}>`;
    const res = await fetch(`${process.env.RESEND_BASE_URL ?? "https://api.resend.com"}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "what2eat/0.1",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!res.ok) {
      console.error("resend_send_failed", res.status);
      if (process.env.NODE_ENV !== "production") {
        outbox.push(input);
        return true;
      }
      return false;
    }
    return true;
  }
  outbox.push(input);
  return true;
}
