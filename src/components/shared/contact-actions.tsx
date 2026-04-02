import { ContactMessagePreset } from "@/lib/contact/message-templates";
import { buildTelHref, buildWhatsAppHref } from "@/lib/contact/contact-links";

type ContactActionsProps = {
  phone?: string;
  message?: string;
  presets?: ContactMessagePreset[];
};

export function ContactActions({ phone, message, presets = [] }: ContactActionsProps) {
  const telHref = phone ? buildTelHref(phone) : "";
  const defaultWhatsAppHref = phone ? buildWhatsAppHref(phone, message) : "";
  const whatsAppActions =
    presets.length > 0
      ? presets
          .map((preset) => ({
            label: preset.label,
            href: phone ? buildWhatsAppHref(phone, preset.message) : ""
          }))
          .filter((preset) => preset.href)
      : defaultWhatsAppHref
        ? [{ label: "واتساب مباشر", href: defaultWhatsAppHref }]
        : [];

  if (!telHref && whatsAppActions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 p-3">
      <div className="mb-2 text-xs font-semibold text-slate-500">تواصل سريع</div>
      <div className="flex flex-wrap gap-2">
        {whatsAppActions.map((preset) => (
          <a
            key={`${preset.label}-${preset.href}`}
            href={preset.href}
            target="_blank"
            rel="noreferrer"
            aria-label={preset.label}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
          >
            {preset.label}
          </a>
        ))}

        {telHref ? (
          <a
            href={telHref}
            aria-label="اتصال مباشر"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            اتصال مباشر
          </a>
        ) : null}
      </div>
    </div>
  );
}
