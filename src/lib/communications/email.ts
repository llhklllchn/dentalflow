import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
};

const globalForMail = globalThis as unknown as {
  smtpTransporter?: nodemailer.Transporter;
};

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 0);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "DentFlow";
  const secure =
    process.env.SMTP_SECURE === "true" || (!Number.isNaN(port) && port === 465);

  if (!host || !port || !user || !pass || !fromEmail) {
    throw new Error("SMTP is not fully configured.");
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName
  };
}

export function isSmtpConfigured() {
  try {
    getSmtpConfig();
    return true;
  } catch {
    return false;
  }
}

function getTransporter() {
  if (globalForMail.smtpTransporter) {
    return globalForMail.smtpTransporter;
  }

  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  if (process.env.NODE_ENV !== "production") {
    globalForMail.smtpTransporter = transporter;
  }

  return transporter;
}

export async function sendEmail(input: SendEmailInput) {
  const config = getSmtpConfig();

  await getTransporter().sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
}
