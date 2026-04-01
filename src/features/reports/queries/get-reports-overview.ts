import { reportsOverview } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatFullName, toMoneyNumber } from "@/lib/domain/mappers";
import { daysAgo } from "@/lib/domain/presentation";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";

type GetReportsOverviewOptions = {
  periodDays?: 7 | 30 | 90;
  includeOperational?: boolean;
};

const reportPeriods = [7, 30, 90] as const;

export async function getReportsOverview(options?: GetReportsOverviewOptions) {
  const periodDays = reportPeriods.includes(options?.periodDays as (typeof reportPeriods)[number])
    ? (options?.periodDays as 7 | 30 | 90)
    : 30;
  const includeOperational = options?.includeOperational ?? true;

  return await runWithDataSource({
    demo: async () => reportsOverview,
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const periodStart = daysAgo(periodDays);

      const [outstanding, revenueCollected, invoices] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            clinicId,
            balance: {
              gt: 0
            },
            status: {
              not: "CANCELLED"
            }
          },
          _sum: {
            balance: true
          }
        }),
        prisma.payment.aggregate({
          where: {
            clinicId,
            paidAt: {
              gte: periodStart
            }
          },
          _sum: {
            amount: true
          }
        }),
        prisma.invoice.findMany({
          where: {
            clinicId,
            issueDate: {
              gte: periodStart
            }
          },
          select: {
            total: true,
            status: true
          }
        })
      ]);

      const [appointmentsCount, newPatients, appointmentRecords, noShowCount] =
        includeOperational
          ? await Promise.all([
              prisma.appointment.count({
                where: {
                  clinicId,
                  startsAt: {
                    gte: periodStart
                  }
                }
              }),
              prisma.patient.count({
                where: {
                  clinicId,
                  createdAt: {
                    gte: periodStart
                  }
                }
              }),
              prisma.appointment.findMany({
                where: {
                  clinicId,
                  startsAt: {
                    gte: periodStart
                  }
                },
                include: {
                  service: true,
                  dentist: {
                    include: {
                      user: true
                    }
                  }
                }
              }),
              prisma.appointment.count({
                where: {
                  clinicId,
                  status: "NO_SHOW",
                  startsAt: {
                    gte: periodStart
                  }
                }
              })
            ])
          : [0, 0, [], 0] as const;

      const performanceMap = new Map<
        string,
        { dentistName: string; visits: number; completed: number; revenue: number }
      >();
      const peakHourMap = new Map<string, number>();

      for (const appointment of appointmentRecords) {
        const dentistName = formatFullName(
          appointment.dentist.user.firstName,
          appointment.dentist.user.lastName
        );
        const current = performanceMap.get(appointment.dentistId) ?? {
          dentistName,
          visits: 0,
          completed: 0,
          revenue: 0
        };

        current.visits += 1;
        current.revenue += toMoneyNumber(appointment.service.price);

        if (appointment.status === "COMPLETED") {
          current.completed += 1;
        }

        performanceMap.set(appointment.dentistId, current);

        const hour = appointment.startsAt.getHours();
        const slot = `${String(hour).padStart(2, "0")}:00 - ${String((hour + 1) % 24).padStart(2, "0")}:00`;
        peakHourMap.set(slot, (peakHourMap.get(slot) ?? 0) + 1);
      }

      const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID").length;
      const partialInvoices = invoices.filter(
        (invoice) => invoice.status === "PARTIALLY_PAID"
      ).length;
      const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
      const noShowRate =
        appointmentsCount > 0 ? `${Math.round((noShowCount / appointmentsCount) * 100)}%` : "0%";
      const peakHours = Array.from(peakHourMap.entries())
        .map(([slot, appointments]) => ({
          slot,
          appointments
        }))
        .sort((left, right) => right.appointments - left.appointments)
        .slice(0, 5);

      const performanceValues = Array.from(performanceMap.values());
      const averageCompletion = performanceValues.length
        ? Math.round(
            performanceValues.reduce((sum, item) => {
              if (item.visits === 0) {
                return sum;
              }

              return sum + Math.round((item.completed / item.visits) * 100);
            }, 0) / performanceValues.length
          )
        : 0;
      const totalInvoicesCount = paidInvoices + partialInvoices + overdueInvoices;
      const collectionRatio =
        totalInvoicesCount > 0 ? Math.round((paidInvoices / totalInvoicesCount) * 100) : 0;
      const peakHourLoad = peakHours[0]?.appointments ?? 0;

      return {
        summary: [
          {
            label: `المواعيد خلال ${periodDays} يومًا`,
            value: String(appointmentsCount),
            hint: "يمكن تغيير الفترة من أعلى الشاشة"
          },
          {
            label: "مرضى جدد",
            value: String(newPatients),
            hint: `منذ آخر ${periodDays} يومًا`
          },
          {
            label: "إيراد محصل",
            value: formatCurrency(revenueCollected._sum.amount, clinic.currency),
            hint: "مدفوعات مسجلة خلال الفترة"
          },
          {
            label: "نسبة no-show",
            value: noShowRate,
            hint: "مقارنة بإجمالي المواعيد في نفس الفترة"
          }
        ],
        financialMetrics: [
          {
            label: "فواتير مدفوعة",
            value: String(paidInvoices),
            delta: `إجمالي المدفوع خلال ${periodDays} يومًا`
          },
          {
            label: "فواتير جزئية",
            value: String(partialInvoices),
            delta: `من أصل ${invoices.length} فاتورة`
          },
          {
            label: "فواتير متأخرة",
            value: String(overdueInvoices),
            delta: formatCurrency(outstanding._sum.balance, clinic.currency)
          }
        ],
        doctorPerformance: performanceValues.map((item) => ({
          dentistName: item.dentistName,
          visits: item.visits,
          revenue: formatCurrency(item.revenue, clinic.currency),
          completionRate:
            item.visits > 0 ? `${Math.round((item.completed / item.visits) * 100)}%` : "0%"
        })),
        peakHours:
          peakHours.length > 0
            ? peakHours
            : [
                { slot: "09:00 - 10:00", appointments: 0 },
                { slot: "10:00 - 11:00", appointments: 0 }
              ],
        executiveSignals: [
          {
            label: "قوة التحصيل",
            value: `${collectionRatio}%`,
            description: "نسبة الفواتير المكتملة من إجمالي فواتير الفترة.",
            tone: collectionRatio >= 80 ? "emerald" : collectionRatio >= 60 ? "brand" : "amber"
          },
          {
            label: "ثبات الأداء",
            value: `${averageCompletion}%`,
            description: "متوسط إكمال الزيارات عبر الأطباء في الفترة الحالية.",
            tone:
              averageCompletion >= 90
                ? "emerald"
                : averageCompletion >= 75
                  ? "brand"
                  : "amber"
          },
          {
            label: "ضغط الذروة",
            value: String(peakHourLoad),
            description: "أعلى عدد مواعيد ظهر داخل نافذة زمنية واحدة.",
            tone: peakHourLoad >= 15 ? "amber" : "slate"
          }
        ],
        actionPrompts: [
          {
            title:
              overdueInvoices > 0
                ? `عالج ${overdueInvoices} فواتير متأخرة`
                : "التحصيل المتأخر تحت السيطرة",
            description:
              overdueInvoices > 0
                ? "التركيز على الفواتير المتأخرة يرفع تدفق السيولة بشكل مباشر."
                : "لا توجد كتل متأخرة تضغط على التحصيل حاليًا.",
            href: "/invoices",
            cta: "فتح الفواتير",
            tone: overdueInvoices > 0 ? "rose" : "emerald"
          },
          {
            title:
              peakHourLoad >= 15 ? "أعد توزيع الذروة" : "الذروة الزمنية متوازنة",
            description:
              peakHourLoad >= 15
                ? "التركيز الزمني العالي يحتاج ضبطًا في الجدولة والمدد."
                : "لا توجد نافذة مزدحمة بشكل حاد داخل الفترة الحالية.",
            href: "/settings",
            cta: "فتح الإعدادات",
            tone: peakHourLoad >= 15 ? "amber" : "emerald"
          },
          {
            title: "اربط التقرير بالتنفيذ",
            description:
              "حوّل القراءة التنفيذية إلى خطوات تشغيل ومتابعة يومية عبر لوحة التحكم.",
            href: "/dashboard",
            cta: "فتح لوحة التحكم",
            tone: "brand"
          }
        ]
      };
    }
  });
}
