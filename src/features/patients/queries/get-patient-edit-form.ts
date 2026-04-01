import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { getSessionClinicId } from "@/lib/tenant/scope";

export async function getPatientEditForm(patientId: string) {
  return await runWithDataSource({
    demo: async () => ({
      id: patientId,
      firstName: "سارة",
      lastName: "علي",
      gender: "female",
      dateOfBirth: "1994-04-12",
      phone: "0790000000",
      whatsappPhone: "0790000000",
      email: "sara@example.com",
      nationalId: "1234567890",
      city: "عمان",
      address: "الجبيهة",
      notes: "مراجعة كل 6 أشهر",
      allergies: "Penicillin",
      chronicConditions: "Diabetes",
      currentMedications: "Metformin"
    }),
    live: async () => {
      const clinicId = await getSessionClinicId();
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          clinicId,
          archivedAt: null
        },
        include: {
          medicalHistory: true
        }
      });

      if (!patient) {
        throw new Error("المريض غير موجود.");
      }

      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        gender: patient.gender ?? "",
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString().slice(0, 10) : "",
        phone: patient.phone,
        whatsappPhone: patient.whatsappPhone ?? "",
        email: patient.email ?? "",
        nationalId: patient.nationalId ?? "",
        city: patient.city ?? "",
        address: patient.address ?? "",
        notes: patient.notes ?? "",
        allergies: patient.medicalHistory?.allergies ?? "",
        chronicConditions: patient.medicalHistory?.chronicConditions ?? "",
        currentMedications: patient.medicalHistory?.currentMedications ?? ""
      };
    }
  });
}
