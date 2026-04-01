import { settingsOverview } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatWorkingHours } from "@/lib/domain/presentation";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";

function valueToTextarea(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.join("\n");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return "";
}

export async function getSettingsOverview() {
  return await runWithDataSource({
    demo: async () => settingsOverview,
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinicContext = await getClinicContext();
      const [clinic, template] = await Promise.all([
        prisma.clinic.findUnique({
          where: {
            id: clinicId
          }
        }),
        prisma.notificationTemplate.findFirst({
          where: {
            clinicId,
            isActive: true
          },
          orderBy: {
            createdAt: "asc"
          }
        })
      ]);

      if (!clinic) {
        return settingsOverview;
      }

      return {
        clinicInfo: {
          name: clinic.name,
          phone: clinic.phone ?? "",
          email: clinic.email ?? "",
          city: clinic.city ?? "",
          address: clinic.address ?? "",
          currency: clinic.currency ?? clinicContext.currency,
          timezone: clinic.timezone ?? clinicContext.timezone,
          language: clinic.language ?? clinicContext.locale
        },
        workingHours: {
          days: formatWorkingHours(clinic.workingDaysJson),
          hours: formatWorkingHours(clinic.workingHoursJson),
          workingDaysInput: valueToTextarea(clinic.workingDaysJson),
          workingHoursInput: valueToTextarea(clinic.workingHoursJson),
          defaultAppointmentDurationMinutes: clinic.defaultAppointmentDuration ?? 30,
          defaultAppointmentDuration: `${clinic.defaultAppointmentDuration ?? 30} دقيقة`
        },
        billing: {
          invoicePrefix: "INV",
          defaultTax: "0%",
          footerNote: "شكراً لثقتكم بعيادة DentFlow."
        },
        reminders: {
          enabled: Boolean(template),
          leadTime: "24 ساعة",
          channel: template?.channel.toLowerCase() ?? "whatsapp"
        }
      };
    }
  });
}
