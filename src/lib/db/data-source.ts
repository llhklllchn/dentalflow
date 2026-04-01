import { isDemoMode } from "@/lib/config/runtime";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function shouldUseDemoData() {
  return isDemoMode() || !isDatabaseConfigured();
}

export function assertLiveDataSource() {
  if (shouldUseDemoData()) {
    throw new Error(
      "The live data source is disabled. Set DENTFLOW_DEMO_MODE=false and configure DATABASE_URL."
    );
  }
}

export async function runWithDataSource<T>(options: {
  live: () => Promise<T>;
  demo: () => Promise<T> | T;
}) {
  if (shouldUseDemoData()) {
    return await options.demo();
  }

  return await options.live();
}
