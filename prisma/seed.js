/* eslint-disable @typescript-eslint/no-require-imports */
const process = require("node:process");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { createHash, randomBytes, scryptSync } = require("node:crypto");
const { Pool } = require("pg");

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool)
});

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createDate(value) {
  return new Date(value);
}

async function main() {
  const demoSlug = "dentflow-demo-clinic";
  const demoPassword = "DemoPass123!";
  const passwordHash = hashPassword(demoPassword);

  const existingClinic = await prisma.clinic.findUnique({
    where: {
      slug: demoSlug
    },
    select: {
      id: true
    }
  });

  if (existingClinic) {
    await prisma.clinic.delete({
      where: {
        id: existingClinic.id
      }
    });
  }

  const clinic = await prisma.clinic.create({
    data: {
      name: "DentFlow Demo Clinic",
      slug: demoSlug,
      phone: "+96265000000",
      email: "info@dentflow.local",
      country: "Jordan",
      city: "Amman",
      address: "Shmeisani, Amman",
      timezone: "Asia/Amman",
      currency: "JOD",
      language: "ar-JO",
      workingDaysJson: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      workingHoursJson: {
        start: "09:00",
        end: "18:00"
      },
      defaultAppointmentDuration: 30
    }
  });

  const owner = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firstName: "مالك",
      lastName: "التجربة",
      email: "owner@dentflow.local",
      phone: "+962790000010",
      passwordHash,
      role: "OWNER",
      status: "ACTIVE"
    }
  });

  const dentistUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firstName: "ليث",
      lastName: "السالم",
      email: "dentist@dentflow.local",
      phone: "+962790000011",
      passwordHash,
      role: "DENTIST",
      status: "ACTIVE"
    }
  });

  const receptionist = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firstName: "أمل",
      lastName: "سمير",
      email: "reception@dentflow.local",
      phone: "+962790000012",
      passwordHash,
      role: "RECEPTIONIST",
      status: "ACTIVE"
    }
  });

  const accountant = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firstName: "نور",
      lastName: "حسن",
      email: "accounting@dentflow.local",
      phone: "+962790000013",
      passwordHash,
      role: "ACCOUNTANT",
      status: "ACTIVE"
    }
  });

  const dentist = await prisma.dentist.create({
    data: {
      clinicId: clinic.id,
      userId: dentistUser.id,
      specialty: "General Dentistry",
      licenseNumber: "DEN-2026-001",
      colorCode: "#269f99",
      defaultAppointmentDuration: 30,
      workingDaysJson: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      workingHoursJson: {
        start: "09:00",
        end: "17:00"
      }
    }
  });

  const consultation = await prisma.service.create({
    data: {
      clinicId: clinic.id,
      name: "Consultation",
      description: "Initial dental examination and assessment.",
      defaultDurationMinutes: 30,
      price: 20
    }
  });

  const cleaning = await prisma.service.create({
    data: {
      clinicId: clinic.id,
      name: "Cleaning",
      description: "Scaling and polishing session.",
      defaultDurationMinutes: 45,
      price: 35
    }
  });

  const filling = await prisma.service.create({
    data: {
      clinicId: clinic.id,
      name: "Filling",
      description: "Composite filling treatment.",
      defaultDurationMinutes: 45,
      price: 80
    }
  });

  const rootCanal = await prisma.service.create({
    data: {
      clinicId: clinic.id,
      name: "Root Canal",
      description: "Root canal treatment.",
      defaultDurationMinutes: 60,
      price: 120
    }
  });

  const sara = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      firstName: "سارة",
      lastName: "علي",
      gender: "female",
      dateOfBirth: createDate("1995-06-15T00:00:00.000Z"),
      phone: "+962790000001",
      whatsappPhone: "+962790000001",
      email: "sara@example.com",
      city: "Amman",
      address: "Al Jubeiha",
      notes: "Prefer WhatsApp reminders."
    }
  });

  const mohammad = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      firstName: "محمد",
      lastName: "خليل",
      gender: "male",
      dateOfBirth: createDate("1988-11-02T00:00:00.000Z"),
      phone: "+962790000002",
      whatsappPhone: "+962790000002",
      email: "mohammad@example.com",
      city: "Zarqa",
      address: "Russeifa",
      notes: "Prefers afternoon appointments."
    }
  });

  const lojain = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      firstName: "لجين",
      lastName: "أحمد",
      gender: "female",
      dateOfBirth: createDate("2001-01-12T00:00:00.000Z"),
      phone: "+962790000003",
      whatsappPhone: "+962790000003",
      email: "lojain@example.com",
      city: "Irbid",
      address: "Downtown",
      notes: "Needs approval for the treatment plan."
    }
  });

  await prisma.patientMedicalHistory.create({
    data: {
      clinicId: clinic.id,
      patientId: sara.id,
      allergies: "Penicillin",
      chronicConditions: "None",
      currentMedications: "None",
      smokingStatus: "Non-smoker",
      pregnancyStatus: "Not pregnant",
      medicalNotes: "Sensitive to strong antibiotics.",
      updatedBy: owner.id
    }
  });

  await prisma.patientMedicalHistory.create({
    data: {
      clinicId: clinic.id,
      patientId: mohammad.id,
      allergies: "None",
      chronicConditions: "Hypertension",
      currentMedications: "Amlodipine",
      smokingStatus: "Former smoker",
      pregnancyStatus: "N/A",
      medicalNotes: "Monitor blood pressure before long procedures.",
      updatedBy: owner.id
    }
  });

  const appointmentOne = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: sara.id,
      dentistId: dentist.id,
      serviceId: cleaning.id,
      startsAt: createDate("2026-03-29T09:30:00+03:00"),
      endsAt: createDate("2026-03-29T10:15:00+03:00"),
      status: "CONFIRMED",
      confirmationStatus: "confirmed",
      notes: "Reminder already sent.",
      createdBy: receptionist.id,
      updatedBy: receptionist.id
    }
  });

  const appointmentTwo = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: mohammad.id,
      dentistId: dentist.id,
      serviceId: rootCanal.id,
      startsAt: createDate("2026-03-29T10:30:00+03:00"),
      endsAt: createDate("2026-03-29T11:30:00+03:00"),
      status: "CHECKED_IN",
      confirmationStatus: "confirmed",
      notes: "Second root canal session.",
      createdBy: receptionist.id,
      updatedBy: receptionist.id
    }
  });

  const appointmentThree = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: lojain.id,
      dentistId: dentist.id,
      serviceId: consultation.id,
      startsAt: createDate("2026-03-30T11:30:00+03:00"),
      endsAt: createDate("2026-03-30T12:00:00+03:00"),
      status: "SCHEDULED",
      confirmationStatus: "pending",
      notes: "First treatment plan consultation.",
      createdBy: receptionist.id
    }
  });

  await prisma.appointmentStatusLog.createMany({
    data: [
      {
        clinicId: clinic.id,
        appointmentId: appointmentOne.id,
        oldStatus: "SCHEDULED",
        newStatus: "CONFIRMED",
        changedBy: receptionist.id
      },
      {
        clinicId: clinic.id,
        appointmentId: appointmentTwo.id,
        oldStatus: "CONFIRMED",
        newStatus: "CHECKED_IN",
        changedBy: receptionist.id
      }
    ]
  });

  await prisma.dentalRecord.create({
    data: {
      clinicId: clinic.id,
      patientId: sara.id,
      dentistId: dentist.id,
      appointmentId: appointmentOne.id,
      chiefComplaint: "Intermittent pain in the upper right side.",
      examinationNotes: "Visible decay around tooth 14.",
      diagnosis: "Tooth 14 caries",
      procedureDone: "Composite filling",
      prescription: "Painkiller if needed",
      followUpNotes: "Review after two weeks"
    }
  });

  await prisma.toothRecord.createMany({
    data: [
      {
        clinicId: clinic.id,
        patientId: sara.id,
        toothNumber: "14",
        status: "DECAY",
        notes: "Requires monitoring after filling.",
        updatedBy: dentistUser.id
      },
      {
        clinicId: clinic.id,
        patientId: lojain.id,
        toothNumber: "16",
        status: "ROOT_CANAL",
        notes: "Needs crown after root canal.",
        updatedBy: dentistUser.id
      },
      {
        clinicId: clinic.id,
        patientId: lojain.id,
        toothNumber: "25",
        status: "MISSING",
        notes: "Missing tooth recorded for future planning.",
        updatedBy: dentistUser.id
      }
    ]
  });

  const treatmentPlan = await prisma.treatmentPlan.create({
    data: {
      clinicId: clinic.id,
      patientId: lojain.id,
      dentistId: dentist.id,
      title: "Upper Arch Treatment Plan",
      description: "Cleaning, root canal, and crown across multiple sessions.",
      status: "APPROVED",
      estimatedTotalCost: 275,
      approvedAt: createDate("2026-03-28T10:00:00+03:00")
    }
  });

  await prisma.treatmentPlanItem.createMany({
    data: [
      {
        clinicId: clinic.id,
        treatmentPlanId: treatmentPlan.id,
        serviceId: cleaning.id,
        toothNumber: null,
        description: "Comprehensive cleaning",
        estimatedCost: 35,
        status: "COMPLETED",
        sessionOrder: 1,
        plannedDate: createDate("2026-03-20T09:00:00+03:00"),
        completedAt: createDate("2026-03-20T09:45:00+03:00")
      },
      {
        clinicId: clinic.id,
        treatmentPlanId: treatmentPlan.id,
        serviceId: rootCanal.id,
        toothNumber: "16",
        description: "Two-session root canal treatment",
        estimatedCost: 120,
        status: "IN_PROGRESS",
        sessionOrder: 2,
        plannedDate: createDate("2026-03-30T11:30:00+03:00")
      },
      {
        clinicId: clinic.id,
        treatmentPlanId: treatmentPlan.id,
        serviceId: filling.id,
        toothNumber: "16",
        description: "Protective restoration before crown placement",
        estimatedCost: 120,
        status: "PLANNED",
        sessionOrder: 3,
        plannedDate: createDate("2026-04-05T11:00:00+03:00")
      }
    ]
  });

  const invoice = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      patientId: sara.id,
      treatmentPlanId: null,
      invoiceNumber: "INV-2026-0001",
      issueDate: createDate("2026-03-29T09:00:00+03:00"),
      dueDate: createDate("2026-04-05T09:00:00+03:00"),
      status: "PARTIALLY_PAID",
      subtotal: 160,
      discount: 0,
      tax: 0,
      total: 160,
      paidAmount: 40,
      balance: 120,
      notes: "Follow-up invoice for active treatment.",
      createdBy: accountant.id
    }
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        clinicId: clinic.id,
        invoiceId: invoice.id,
        serviceId: filling.id,
        serviceName: "Filling",
        description: "Composite filling for tooth 14",
        quantity: 1,
        unitPrice: 80,
        lineTotal: 80
      },
      {
        clinicId: clinic.id,
        invoiceId: invoice.id,
        serviceId: cleaning.id,
        serviceName: "Cleaning",
        description: "Scaling and polishing session",
        quantity: 1,
        unitPrice: 80,
        lineTotal: 80
      }
    ]
  });

  await prisma.payment.create({
    data: {
      clinicId: clinic.id,
      invoiceId: invoice.id,
      patientId: sara.id,
      amount: 40,
      paymentMethod: "CASH",
      reference: "CASH-0001",
      notes: "Initial payment",
      paidAt: createDate("2026-03-29T12:00:00+03:00"),
      recordedBy: accountant.id
    }
  });

  await prisma.notificationTemplate.createMany({
    data: [
      {
        clinicId: clinic.id,
        name: "Appointment Reminder 24h",
        channel: "WHATSAPP",
        templateKey: "appointment_reminder_24h",
        subject: null,
        body: "مرحبًا {patient_name}، لديك موعد غدًا الساعة {appointment_time} مع {dentist_name}.",
        isActive: true
      },
      {
        clinicId: clinic.id,
        name: "Payment Due Reminder",
        channel: "EMAIL",
        templateKey: "payment_due",
        subject: "فاتورة مستحقة",
        body: "نذكرك بوجود رصيد مستحق على فاتورتك الأخيرة.",
        isActive: true
      }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        clinicId: clinic.id,
        patientId: sara.id,
        appointmentId: appointmentOne.id,
        channel: "WHATSAPP",
        templateKey: "appointment_reminder_24h",
        messageBody: "مرحبًا سارة، لديك موعد غدًا الساعة 09:30 مع د. ليث.",
        status: "SENT",
        scheduledFor: createDate("2026-03-28T09:00:00+03:00"),
        sentAt: createDate("2026-03-28T09:00:00+03:00")
      },
      {
        clinicId: clinic.id,
        patientId: lojain.id,
        appointmentId: appointmentThree.id,
        channel: "WHATSAPP",
        templateKey: "appointment_reminder_24h",
        messageBody: "مرحبًا لجين، لديك موعد غدًا الساعة 11:30 مع د. ليث.",
        status: "PENDING",
        scheduledFor: createDate("2026-03-29T11:30:00+03:00")
      }
    ]
  });

  await prisma.staffInvitation.create({
    data: {
      clinicId: clinic.id,
      email: "assistant@dentflow.local",
      role: "ASSISTANT",
      token: hashToken(randomBytes(24).toString("hex")),
      status: "PENDING",
      expiresAt: createDate("2026-04-05T00:00:00+03:00"),
      invitedBy: owner.id
    }
  });

  await prisma.subscription.create({
    data: {
      clinicId: clinic.id,
      planName: "Pro Demo",
      status: "ACTIVE",
      startsAt: createDate("2026-03-01T00:00:00.000Z"),
      endsAt: createDate("2026-12-31T23:59:59.000Z"),
      billingCycle: "MONTHLY"
    }
  });

  console.log("DentFlow demo clinic seeded successfully.");
  console.log("Owner email: owner@dentflow.local");
  console.log(`Shared demo password: ${demoPassword}`);
}

main()
  .catch((error) => {
    console.error("Failed to seed DentFlow demo clinic.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
