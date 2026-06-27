import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { APP_NAME } from "@/lib/app-config";

let resend: Resend | null = null;
let smtpTransporter: nodemailer.Transporter | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

function getSmtpTransporter() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return smtpTransporter;
}

type AuthEmail = {
  to: string;
  subject: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  code?: string;
  note?: string;
};

async function writeLocalEmail(message: AuthEmail & { from: string; text: string }) {
  const outboxDir = join(process.cwd(), ".local");
  await mkdir(outboxDir, { recursive: true });
  await appendFile(
    join(outboxDir, "email-outbox.jsonl"),
    `${JSON.stringify({ sentAt: new Date().toISOString(), ...message })}\n`,
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendViaResend(
  from: string,
  message: AuthEmail,
  html: string,
  text: string,
): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  try {
    await client.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error("[StarX-Oauth] Resend 发送失败:", error);
    return false;
  }
}

async function sendViaSmtp(
  from: string,
  message: AuthEmail,
  html: string,
  text: string,
): Promise<boolean> {
  const transporter = getSmtpTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error("[StarX-Oauth] SMTP 发送失败:", error);
    return false;
  }
}

export async function sendAuthEmail(message: AuthEmail) {
  const from = process.env.EMAIL_FROM || "StarX-Oauth <noreply@localhost>";
  const text = [
    message.title,
    "",
    message.body,
    message.actionUrl ? `${message.actionLabel || "打开按钮"}: ${message.actionUrl}` : "",
    message.code ? `6 位数字: ${message.code}` : "",
    message.note || "如果这不是你本人的操作，可以忽略这封邮件。",
    "",
    "这封邮件是自动发送的，不用回复。",
    APP_NAME,
  ]
    .filter(Boolean)
    .join("\n");
  const safeTitle = escapeHtml(message.title);
  const safeBody = escapeHtml(message.body);
  const safeActionLabel = escapeHtml(message.actionLabel || "继续");
  const safeActionUrl = message.actionUrl ? escapeHtml(message.actionUrl) : "";
  const safeCode = message.code ? escapeHtml(message.code) : "";
  const safeNote = escapeHtml(message.note || "如果这不是你本人的操作，可以忽略这封邮件。");
  const safeAppName = escapeHtml(APP_NAME);

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#050505;color:#f5f5f7;padding:32px">
      <div style="max-width:560px;margin:0 auto;border:1px solid #2f2f35;border-radius:24px;background:#111113;padding:28px">
        <p style="margin:0 0 14px;color:#8b8b93;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${safeAppName}</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">${safeTitle}</h1>
        <p style="margin:0;color:#d4d4d8;line-height:1.7">${safeBody}</p>
        ${
          safeCode
            ? `<p style="margin:24px 0 0;font-size:34px;letter-spacing:8px;font-weight:800;color:#f5f5f7">${safeCode}</p>`
            : ""
        }
        ${
          message.actionUrl
            ? `<a href="${safeActionUrl}" style="display:inline-block;margin-top:22px;background:#f5f5f7;color:#000000;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">${safeActionLabel}</a>`
            : ""
        }
        <p style="margin:28px 0 0;color:#a1a1aa;line-height:1.6;font-size:13px">${safeNote}</p>
        <p style="margin:16px 0 0;color:#71717a;font-size:12px">这封邮件是自动发送的，不用回复。</p>
      </div>
    </div>
  `;

  const localMessage = { ...message, from, text };

  if (process.env.RESEND_API_KEY) {
    const sent = await sendViaResend(from, message, html, text);
    if (sent) {
      console.info("[StarX-Oauth email] 已通过 Resend 发送");
      return;
    }
    console.warn("[StarX-Oauth] Resend 发送失败，尝试 SMTP...");
  }

  if (process.env.SMTP_HOST) {
    const sent = await sendViaSmtp(from, message, html, text);
    if (sent) {
      console.info("[StarX-Oauth email] 已通过 SMTP 发送");
      return;
    }
    console.warn("[StarX-Oauth] SMTP 发送失败，保存到本地...");
  }

  console.info("[StarX-Oauth email]", JSON.stringify(localMessage, null, 2));
  await writeLocalEmail(localMessage);
}