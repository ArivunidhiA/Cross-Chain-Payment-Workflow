import { NextResponse } from "next/server";
import { getWorkflowStats } from "@/db/store";

export async function GET() {
  try {
    const stats = await getWorkflowStats();
    const successRate =
      stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;

    return NextResponse.json({
      ...stats,
      successRate,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
