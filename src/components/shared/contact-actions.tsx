import { buildTelHref, buildWhatsAppHref } from "@/lib/contact/contact-links";

type ContactActionsProps = {
  phone?: string;
  message?: string;
};

export function ContactActions({ phone, message }: ContactActionsProps) {
  const telHref = phone ? buildTelHref(phone) : "";
  const whatsappHref = phone ? buildWhatsAppHref(phone, message) : "";

  if (!telHref && !whatsappHref) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
        >
          واتساب
        </a>
      ) : null}

      {telHref ? (
        <a
          href={telHref}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          اتصال
        </a>
      ) : null}
    </div>
  );
}
