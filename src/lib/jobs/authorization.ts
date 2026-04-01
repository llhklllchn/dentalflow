import { NextRequest, NextResponse } from "next/server";

export function authorizeJobsRequest(request: NextRequest) {
  const configuredSecret = process.env.DENTFLOW_JOBS_SECRET;

  if (!configuredSecret) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          message: "DENTFLOW_JOBS_SECRET is not configured."
        },
        { status: 500 }
      )
    };
  }

  const bearer = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-jobs-secret");
  const providedSecret =
    headerSecret ?? (bearer?.startsWith("Bearer ") ? bearer.slice(7) : null);

  if (providedSecret !== configuredSecret) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          message: "Unauthorized."
        },
        { status: 401 }
      )
    };
  }

  return { ok: true as const };
}
