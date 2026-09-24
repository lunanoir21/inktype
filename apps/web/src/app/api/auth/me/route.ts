import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser().catch(() => null);
  return NextResponse.json({
    user,
    registrationOpen: process.env.ALLOW_REGISTRATION !== "false",
  });
}
