import process from "node:process";

const baseUrl = process.argv[2]?.trim();

if (!baseUrl) {
  console.error("Usage: npm run smoke:check -- https://your-domain.com");
  process.exit(1);
}

async function expectOk(pathname, expectedStatuses) {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect: "manual"
  });

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${pathname} returned ${response.status}, expected ${expectedStatuses.join(", ")}`);
  }

  return response;
}

try {
  await expectOk("/api/health", [200]);
  await expectOk("/login", [200]);
  await expectOk("/dashboard", [200, 302, 307, 308]);

  console.log(`Smoke check passed for ${baseUrl}`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Smoke check failed with an unknown error."
  );
  process.exit(1);
}
