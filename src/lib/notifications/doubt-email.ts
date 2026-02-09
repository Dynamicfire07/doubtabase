import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { logWarn } from "@/lib/logger";
import type { Difficulty } from "@/types/domain";

type NotificationRecipient = {
  email: string;
  name?: string | null;
};

type NewDoubtNotificationEmailInput = {
  recipients: NotificationRecipient[];
  roomName: string;
  roomId: string;
  doubtId: string;
  doubtTitle: string;
  subject: string;
  difficulty: Difficulty;
  uploaderName: string;
  appBaseUrl?: string | null;
};

type NotificationEmailResult = {
  attempted: number;
  accepted: number;
  rejected: number;
  skipped: boolean;
};

type MailerConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

let cachedTransporter: Transporter | null = null;
let cachedSignature: string | null = null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parsePort(value: string | undefined) {
  if (!value) {
    return 587;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return null;
  }

  return parsed;
}

function parseSecure(value: string | undefined, port: number) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return port === 465;
}

function readMailerConfig(): MailerConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim() || user;
  const port = parsePort(process.env.SMTP_PORT);

  if (!host || !user || !pass || !from || port === null) {
    return null;
  }

  return {
    host,
    port,
    secure: parseSecure(process.env.SMTP_SECURE, port),
    user,
    pass,
    from,
  };
}

function getTransporter() {
  const config = readMailerConfig();
  if (!config) {
    return {
      config: null,
      transporter: null,
    };
  }

  const signature = JSON.stringify(config);
  if (cachedTransporter && cachedSignature === signature) {
    return {
      config,
      transporter: cachedTransporter,
    };
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  cachedSignature = signature;

  return {
    config,
    transporter: cachedTransporter,
  };
}

function resolveBaseUrl(input: string | null | undefined) {
  const raw =
    input?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function createMailBody(input: NewDoubtNotificationEmailInput, detailUrl: string) {
  const escapedTitle = escapeHtml(input.doubtTitle);
  const escapedRoom = escapeHtml(input.roomName);
  const escapedSubject = escapeHtml(input.subject);
  const escapedUploader = escapeHtml(input.uploaderName);
  const escapedDifficulty = escapeHtml(input.difficulty);
  const escapedUrl = escapeHtml(detailUrl);

  const text = [
    `New doubt in ${input.roomName}`,
    "",
    `${input.uploaderName} posted a new doubt in ${input.roomName}.`,
    "",
    `Title: ${input.doubtTitle}`,
    `Subject: ${input.subject}`,
    `Difficulty: ${input.difficulty}`,
    "",
    `Open and collaborate: ${detailUrl}`,
    "",
    "Please review and share your insights in the room comments.",
    "",
    "- Doubtabase",
  ].join("\n");

  const html = `
  <div style="background:#f4f7fb;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:24px 24px 12px 24px;">
          <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Doubtabase Notification</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3;color:#0f172a;">New doubt in ${escapedRoom}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 8px 24px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">
            ${escapedUploader} posted a new doubt and invited room members to collaborate.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 24px;">
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#f8fafc;">
            <p style="margin:0 0 8px 0;font-size:18px;line-height:1.4;color:#111827;font-weight:600;">${escapedTitle}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
              <strong>Subject:</strong> ${escapedSubject}<br/>
              <strong>Difficulty:</strong> ${escapedDifficulty}
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 22px 24px;">
          <a href="${escapedUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;border-radius:10px;padding:12px 18px;">Open question</a>
          <p style="margin:12px 0 0 0;font-size:12px;color:#64748b;word-break:break-all;">${escapedUrl}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#64748b;">You are receiving this because you are a member of ${escapedRoom}.</p>
        </td>
      </tr>
    </table>
  </div>`;

  return { text, html };
}

export async function sendNewDoubtNotificationEmail(
  input: NewDoubtNotificationEmailInput,
): Promise<NotificationEmailResult> {
  const uniqueRecipients = Array.from(
    new Map(
      input.recipients
        .map((recipient) => ({
          ...recipient,
          email: recipient.email.trim().toLowerCase(),
        }))
        .filter((recipient) => recipient.email.length > 0)
        .map((recipient) => [recipient.email, recipient]),
    ).values(),
  );

  if (uniqueRecipients.length === 0) {
    return {
      attempted: 0,
      accepted: 0,
      rejected: 0,
      skipped: true,
    };
  }

  const baseUrl = resolveBaseUrl(input.appBaseUrl);
  if (!baseUrl) {
    logWarn("mail.new_doubt.skipped_missing_base_url", {
      room_id: input.roomId,
      doubt_id: input.doubtId,
    });

    return {
      attempted: uniqueRecipients.length,
      accepted: 0,
      rejected: 0,
      skipped: true,
    };
  }

  const { config, transporter } = getTransporter();
  if (!config || !transporter) {
    logWarn("mail.new_doubt.skipped_missing_smtp_config", {
      room_id: input.roomId,
      doubt_id: input.doubtId,
    });

    return {
      attempted: uniqueRecipients.length,
      accepted: 0,
      rejected: 0,
      skipped: true,
    };
  }

  const detailUrl = `${baseUrl}/doubts/${encodeURIComponent(input.doubtId)}?room=${encodeURIComponent(input.roomId)}`;
  const { html, text } = createMailBody(input, detailUrl);

  const info = await transporter.sendMail({
    from: config.from,
    to: config.from,
    bcc: uniqueRecipients.map((recipient) => recipient.email),
    subject: `New doubt in ${input.roomName}`,
    text,
    html,
  });

  return {
    attempted: uniqueRecipients.length,
    accepted: info.accepted.length,
    rejected: info.rejected.length,
    skipped: false,
  };
}
