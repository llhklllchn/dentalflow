import { getAppointmentsBoard } from "@/features/appointments/queries/get-appointments-board";
import { getInvoicesList } from "@/features/invoices/queries/get-invoices-list";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { getPaymentsList } from "@/features/payments/queries/get-payments-list";
import { getTreatmentPlansList } from "@/features/treatment-plans/queries/get-treatment-plans-list";
import { hasPermission } from "@/lib/permissions/permissions";
import { Role } from "@/types/domain";

type GetGlobalSearchResultsOptions = {
  query?: string;
  role: Role;
};

export async function getGlobalSearchResults({
  query,
  role
}: GetGlobalSearchResultsOptions) {
  const normalizedQuery = query?.trim() ?? "";

  if (!normalizedQuery) {
    return {
      query: "",
      patients: [],
      appointments: [],
      invoices: [],
      payments: [],
      treatmentPlans: []
    };
  }

  const canViewPatients = hasPermission(role, "patients:view");
  const canViewAppointments = hasPermission(role, "appointments:view");
  const canViewInvoices = hasPermission(role, "invoices:view");
  const canViewPayments = hasPermission(role, "payments:view");
  const canViewTreatmentPlans = hasPermission(role, "treatment-plans:view");

  const [patients, appointments, invoices, payments, treatmentPlans] = await Promise.all([
    canViewPatients ? getPatientsList({ search: normalizedQuery }) : Promise.resolve([]),
    canViewAppointments
      ? getAppointmentsBoard({ search: normalizedQuery, status: "all" })
      : Promise.resolve([]),
    canViewInvoices ? getInvoicesList({ search: normalizedQuery }) : Promise.resolve([]),
    canViewPayments ? getPaymentsList({ search: normalizedQuery }) : Promise.resolve([]),
    canViewTreatmentPlans
      ? getTreatmentPlansList({ search: normalizedQuery })
      : Promise.resolve([])
  ]);

  return {
    query: normalizedQuery,
    patients: patients.slice(0, 6),
    appointments: appointments.slice(0, 6),
    invoices: invoices.slice(0, 6),
    payments: payments.slice(0, 6),
    treatmentPlans: treatmentPlans.slice(0, 6)
  };
}
