import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/api/cookies";

export async function POST() {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const data = await backendFetch<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      accessToken,
    });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
