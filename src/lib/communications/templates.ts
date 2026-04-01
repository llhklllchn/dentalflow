type PasswordResetEmailInput = {
  clinicName: string;
  resetUrl: string;
  expiresMinutes: number;
};

type StaffInvitationEmailInput = {
  clinicName: string;
  invitationUrl: string;
  roleLabel: string;
  expiresHours: number;
};

type NotificationEmailInput = {
  clinicName: string;
  subject: string;
  heading: string;
  messageBody: string;
};

type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

function wrapHtml(title: string, body: string) {
  return `
    <div style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#0f172a;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;">
        <div style="font-size:24px;font-weight:700;margin-bottom:16px;">${title}</div>
        ${body}
      </div>
    </div>
  `;
}

export function buildPasswordResetEmail(input: PasswordResetEmailInput): EmailTemplate {
  const subject = `إعادة تعيين كلمة المرور - ${input.clinicName}`;
  const text = [
    `تم طلب إعادة تعيين كلمة المرور لحسابك في ${input.clinicName}.`,
    `افتح الرابط التالي لإعادة التعيين خلال ${input.expiresMinutes} دقيقة:`,
    input.resetUrl
  ].join("\n\n");
  const html = wrapHtml(
    "إعادة تعيين كلمة المرور",
    `
      <p>تم طلب إعادة تعيين كلمة المرور لحسابك في <strong>${input.clinicName}</strong>.</p>
      <p>
        <a href="${input.resetUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;">
          افتح رابط إعادة التعيين
        </a>
      </p>
      <p>إذا لم يفتح الزر، استخدم هذا الرابط مباشرة:</p>
      <p><a href="${input.resetUrl}">${input.resetUrl}</a></p>
      <p>صلاحية الرابط: ${input.expiresMinutes} دقيقة.</p>
    `
  );

  return { subject, text, html };
}

export function buildStaffInvitationEmail(input: StaffInvitationEmailInput): EmailTemplate {
  const subject = `دعوة للانضمام إلى ${input.clinicName}`;
  const text = [
    `تمت دعوتك للانضمام إلى ${input.clinicName} بدور ${input.roleLabel}.`,
    `افتح الرابط التالي خلال ${input.expiresHours} ساعة لإكمال الحساب:`,
    input.invitationUrl
  ].join("\n\n");
  const html = wrapHtml(
    "دعوة للانضمام إلى العيادة",
    `
      <p>تمت دعوتك للانضمام إلى <strong>${input.clinicName}</strong> بدور <strong>${input.roleLabel}</strong>.</p>
      <p>
        <a href="${input.invitationUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;">
          قبول الدعوة
        </a>
      </p>
      <p>إذا لم يفتح الزر، استخدم هذا الرابط مباشرة:</p>
      <p><a href="${input.invitationUrl}">${input.invitationUrl}</a></p>
      <p>صلاحية الدعوة: ${input.expiresHours} ساعة.</p>
    `
  );

  return { subject, text, html };
}

export function buildNotificationEmail(input: NotificationEmailInput): EmailTemplate {
  const text = [`${input.heading}`, input.messageBody, input.clinicName].join("\n\n");
  const html = wrapHtml(
    input.heading,
    `
      <p>${input.messageBody}</p>
      <p style="margin-top:24px;color:#475569;">${input.clinicName}</p>
    `
  );

  return {
    subject: input.subject,
    text,
    html
  };
}
