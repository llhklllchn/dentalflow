import { AppointmentStatus } from "@/types/domain";

const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ["confirmed", "cancelled", "no_show"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: ["scheduled", "confirmed"]
};

export function ensureValidAppointmentWindow(startsAt: Date, endsAt: Date) {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Appointment start and end times must be valid.");
  }

  if (endsAt <= startsAt) {
    throw new Error("Appointment end time must be after the start time.");
  }
}

export function hasAppointmentOverlap(input: {
  startsAt: Date;
  endsAt: Date;
  existingAppointments: Array<{
    startsAt: Date;
    endsAt: Date;
  }>;
}) {
  return input.existingAppointments.some((appointment) => {
    return input.startsAt < appointment.endsAt && input.endsAt > appointment.startsAt;
  });
}

export function assertAppointmentStatusTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
) {
  if (currentStatus === nextStatus) {
    return;
  }

  const validTargets = allowedTransitions[currentStatus];

  if (!validTargets.includes(nextStatus)) {
    throw new Error(
      `Appointment status cannot move from ${currentStatus} to ${nextStatus}.`
    );
  }
}
