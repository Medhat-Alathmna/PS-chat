import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";
import { decodeJwtPayload } from "@/lib/api/backend";

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const payload = decodeJwtPayload(accessToken);
    const exp = payload.exp as number | undefined;
    if (exp && Date.now() / 1000 > exp) {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }

    return NextResponse.json({
      userId: payload.sub as string,
      email: payload.email as string,
    });
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
