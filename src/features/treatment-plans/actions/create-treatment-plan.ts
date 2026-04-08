"use server";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { toDatabaseEnum } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";
import { treatmentPlanFormSchema } from "@/features/treatment-plans/schemas/treatment-plan-form.schema";

export async function createTreatmentPlan(input: unknown) {
  const parsed = treatmentPlanFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات خطة العلاج. وضع الديمو لا يحفظها فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "treatment-plans:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإنشاء خطط العلاج."
      };
    }

    const [patient, dentist, service] = await Promise.all([
      prisma.patient.findFirst({
        where: {
          id: parsed.data.patientId,
          clinicId: user.clinicId,
          archivedAt: null
        },
        select: {
          id: true
        }
      }),
      prisma.dentist.findFirst({
        where: {
          id: parsed.data.dentistId,
          clinicId: user.clinicId
        },
        select: {
          id: true
        }
      }),
      prisma.service.findFirst({
        where: {
          clinicId: user.clinicId,
          name: parsed.data.serviceName
        },
        select: {
          id: true
        }
      })
    ]);

    if (!patient || !dentist) {
      return {
        ok: false,
        message: "المريض أو الطبيب غير متاحين داخل العيادة الحالية."
      };
    }

    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        clinicId: user.clinicId,
        patientId: parsed.data.patientId,
        dentistId: parsed.data.dentistId,
        title: parsed.data.title,
        status: toDatabaseEnum(parsed.data.status) as
          | "DRAFT"
          | "PLANNED"
          | "APPROVED"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "CANCELLED",
        estimatedTotalCost: parsed.data.estimatedCost,
        items: {
          create: {
            clinicId: user.clinicId,
            serviceId: service?.id ?? null,
            toothNumber: parsed.data.toothNumber || null,
            description: parsed.data.description || null,
            estimatedCost: parsed.data.estimatedCost,
            status: toDatabaseEnum(parsed.data.status) as
              | "DRAFT"
              | "PLANNED"
              | "APPROVED"
              | "IN_PROGRESS"
              | "COMPLETED"
              | "CANCELLED",
            sessionOrder: parsed.data.sessionOrder,
            plannedDate: parsed.data.plannedDate ? new Date(parsed.data.plannedDate) : null
          }
        }
      }
    });

    await writeAuditLog({
      entityType: "treatment_plan",
      entityId: treatmentPlan.id,
      action: "create",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم إنشاء خطة العلاج بنجاح.",
      data: {
        id: treatmentPlan.id
      }
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر إنشاء خطة العلاج."
    };
  }
}
