export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createGuestSession } from "@/lib/auth/session";

export async function POST() {
  try {
    const { userId } = await createGuestSession();

    return NextResponse.json({
      success: true,
      userId,
      message: "Guest session initialized",
    });
  } catch (error) {
    console.error("[GUEST_AUTH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize guest workspace" },
      { status: 500 }
    );
  }
}