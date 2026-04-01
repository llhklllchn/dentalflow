export type QueryValue = string | number | undefined | null;

export function buildQueryPath(
  basePath: string,
  values: Record<string, QueryValue>
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue;
    }

    const normalizedValue = String(value).trim();

    if (!normalizedValue) {
      continue;
    }

    query.set(key, normalizedValue);
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function buildAppointmentCreatePath(values: {
  patientId?: string;
  dentistId?: string;
  serviceId?: string;
  status?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}) {
  return buildQueryPath("/appointments/new", values);
}

export function buildInvoiceCreatePath(values: {
  patientId?: string;
  issueDate?: string;
  dueDate?: string;
  serviceName?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  notes?: string;
}) {
  return buildQueryPath("/invoices/new", values);
}

export function buildPaymentCreatePath(values: {
  invoiceId?: string;
  patientId?: string;
}) {
  return buildQueryPath("/payments/new", values);
}

export function buildDentalRecordCreatePath(values: {
  patientId?: string;
  dentistId?: string;
  appointmentDate?: string;
  toothNumbers?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  followUpNotes?: string;
}) {
  return buildQueryPath("/dental-records/new", values);
}

export function buildTreatmentPlanCreatePath(values: {
  patientId?: string;
  dentistId?: string;
  title?: string;
  status?: string;
  serviceName?: string;
  toothNumber?: string;
  description?: string;
  estimatedCost?: number;
  sessionOrder?: number;
  plannedDate?: string;
}) {
  return buildQueryPath("/treatment-plans/new", values);
}
