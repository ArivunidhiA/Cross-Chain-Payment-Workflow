import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/db/store";
import type { ChainId } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId") || undefined;
    const chain = (searchParams.get("chain") as ChainId) || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");

    const logs = getAuditLogs({ workflowId, chain, status, limit });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
