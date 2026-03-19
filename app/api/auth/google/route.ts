import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

export async function GET() {
  // Redirect browser to NestJS Google OAuth initiation endpoint
  return NextResponse.redirect(`${BACKEND_URL}/api/auth/google`);
}
