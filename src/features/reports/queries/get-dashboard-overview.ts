import { dashboardOverview } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  formatCurrency,
  formatFullName,
  formatTime,
  fromDatabaseEnum,
  toMoneyNumber
} from "@/lib/domain/mappers";
import { daysAgo, endOfToday, startOfToday } from "@/lib/domain/presentation";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { AppointmentStatus } from "@/types/domain";

export async function getDashboardOverview() {
  return await runWithDataSource({
    demo: async () => dashboardOverview,
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const todayStart = startOfToday();
      const todayEnd = endOfToday();
      const tomorrowEnd = new Date(todayEnd);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

      const [
        appointmentsToday,
        newPatients,
        noShowToday,
        paymentsToday,
        upcomingAppointments,
        overdueInvoicesCount,
        pendingInvitationsCount,
        unconfirmedTomorrow
      ] = await Promise.all([
        prisma.appointment.count({
          where: {
            clinicId,
            startsAt: {
              gte: todayStart,
              lt: todayEnd
            }
          }
        }),
        prisma.patient.count({
          where: {
            clinicId,
            createdAt: {
              gte: daysAgo(7)
            }
          }
        }),
        prisma.appointment.count({
          where: {
            clinicId,
            status: "NO_SHOW",
            startsAt: {
              gte: todayStart,
              lt: todayEnd
            }
          }
        }),
        prisma.payment.aggregate({
          where: {
            clinicId,
            paidAt: {
              gte: todayStart,
              lt: todayEnd
            }
          },
          _sum: {
            amount: true
          }
        }),
        prisma.appointment.findMany({
          where: {
            clinicId,
            startsAt: {
              gte: todayStart,
              lt: todayEnd
            }
          },
          orderBy: {
            startsAt: "asc"
          },
          take: 5,
          include: {
            patient: true,
            dentist: {
              include: {
                user: true
              }
            }
          }
        }),
        prisma.invoice.count({
          where: {
            clinicId,
            dueDate: {
              lt: new Date()
            },
            balance: {
              gt: 0
            },
            status: {
              not: "CANCELLED"
            }
          }
        }),
        prisma.staffInvitation.count({
          where: {
            clinicId,
            status: "PENDING"
          }
        }),
        prisma.appointment.count({
          where: {
            clinicId,
            status: "SCHEDULED",
            startsAt: {
              gte: todayEnd,
              lt: tomorrowEnd
            }
          }
        })
      ]);

      const revenueToday = toMoneyNumber(paymentsToday._sum.amount);
      const sessionReadiness =
        appointmentsToday > 0
          ? Math.round(((appointmentsToday - noShowToday) / appointmentsToday) * 100)
          : 100;
      const followUpPressure =
        overdueInvoicesCount + pendingInvitationsCount + unconfirmedTomorrow;

      return {
        stats: [
          {
            label: "مواعيد اليوم",
            value: String(appointmentsToday),
            hint: "من بداية اليوم وحتى نهايته"
          },
          {
            label: "مرضى جدد",
            value: String(newPatients),
            hint: "خلال آخر 7 أيام"
          },
          {
            label: "حالات عدم الحضور",
            value: String(noShowToday),
            hint: "بناءً على الحالات المسجلة"
          },
          {
            label: "إيراد اليوم",
            value: formatCurrency(revenueToday, clinic.currency),
            hint: "مدفوعات اليوم المسجلة"
          }
        ],
        upcomingAppointments: upcomingAppointments.map((appointment) => ({
          id: appointment.id,
          patientId: appointment.patientId,
          patientName: formatFullName(
            appointment.patient.firstName,
            appointment.patient.lastName
          ),
          dentistName: formatFullName(
            appointment.dentist.user.firstName,
            appointment.dentist.user.lastName
          ),
          time: formatTime(appointment.startsAt),
          status: fromDatabaseEnum<AppointmentStatus>(appointment.status)
        })),
        alerts: [
          `${unconfirmedTomorrow} مواعيد غير مؤكدة غدًا`,
          `${overdueInvoicesCount} فواتير متأخرة`,
          `${pendingInvitationsCount} دعوات موظفين معلقة`
        ],
        executiveSignals: [
          {
            label: "جاهزية الجلسات",
            value: `${sessionReadiness}%`,
            description: "نسبة المواعيد التي لم تتعثر بغياب المرضى خلال اليوم.",
            tone:
              sessionReadiness >= 90 ? "emerald" : sessionReadiness >= 75 ? "brand" : "amber"
          },
          {
            label: "تحصيل اليوم",
            value: formatCurrency(revenueToday, clinic.currency),
            description: "المدفوعات المسجلة من بداية اليوم حتى الآن.",
            tone: revenueToday > 0 ? "emerald" : "slate"
          },
          {
            label: "ضغط المتابعة",
            value: String(followUpPressure),
            description: "عناصر تحتاج تدخلًا تشغيليًا قبل نهاية اليوم.",
            tone: followUpPressure > 0 ? "amber" : "emerald"
          }
        ],
        actionPrompts: [
          {
            title:
              unconfirmedTomorrow > 0
                ? `ثبت ${unconfirmedTomorrow} مواعيد للغد`
                : "المواعيد القادمة مثبتة",
            description:
              unconfirmedTomorrow > 0
                ? "ابدأ بتثبيت جدول الغد حتى يبقى التقويم مستقرًا."
                : "لا توجد مواعيد غير مؤكدة للغد حاليًا.",
            href: "/appointments",
            cta: "فتح المواعيد",
            tone: unconfirmedTomorrow > 0 ? "amber" : "emerald"
          },
          {
            title:
              overdueInvoicesCount > 0
                ? `تابع ${overdueInvoicesCount} فواتير متأخرة`
                : "وضع التحصيل مستقر",
            description:
              overdueInvoicesCount > 0
                ? "هناك رصيد متأخر يؤثر مباشرة على السيولة إن تُرك دون متابعة."
                : "لا توجد فواتير متأخرة ظاهرة الآن.",
            href: "/invoices",
            cta: "فتح الفواتير",
            tone: overdueInvoicesCount > 0 ? "rose" : "emerald"
          },
          {
            title:
              pendingInvitationsCount > 0
                ? `أكمل ${pendingInvitationsCount} دعوات معلقة`
                : "الفريق مكتمل حاليًا",
            description:
              pendingInvitationsCount > 0
                ? "إنهاء الدعوات المعلقة يقلل التشتيت عند توسيع العمل."
                : "لا توجد دعوات عالقة تحتاج متابعة الآن.",
            href: "/staff",
            cta: "فتح الموظفين",
            tone: pendingInvitationsCount > 0 ? "slate" : "emerald"
          }
        ]
      };
    }
  });
}
