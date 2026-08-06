import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { bogTokenManager } from "@/lib/bog-token";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access_token = await bogTokenManager.getValidToken();
    const tokenInfo = bogTokenManager.getTokenInfo();

    return NextResponse.json({
      access_token,
      token_type: "Bearer",
      expires_in: tokenInfo.timeUntilExpiry
        ? Math.floor(tokenInfo.timeUntilExpiry / 1000)
        : 0,
      success: true,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to get BOG access token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
