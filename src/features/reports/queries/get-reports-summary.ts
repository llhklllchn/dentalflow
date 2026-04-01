import { reportsSummary } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { getReportsOverview } from "@/features/reports/queries/get-reports-overview";

export async function getReportsSummary() {
  return await runWithDataSource({
    demo: async () => reportsSummary,
    live: async () => {
      const overview = await getReportsOverview();
      return overview.summary;
    }
  });
}
