import { runWithDataSource } from "@/lib/db/data-source";
import { getTreatmentPlansList } from "@/features/treatment-plans/queries/get-treatment-plans-list";
import { treatmentPlans } from "@/lib/constants/mock-data";

export async function getTreatmentPlanById(planId: string) {
  return await runWithDataSource({
    demo: async () => treatmentPlans.find((plan) => plan.id === planId) ?? treatmentPlans[0],
    live: async () => {
      const plans = await getTreatmentPlansList();
      return plans.find((plan) => plan.id === planId) ?? plans[0];
    }
  });
}
