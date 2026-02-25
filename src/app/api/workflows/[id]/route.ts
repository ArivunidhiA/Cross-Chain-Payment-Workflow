import { NextRequest, NextResponse } from "next/server";
import { getWorkflow, getAuditLogs } from "@/db/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const auditLogs = await getAuditLogs({ workflowId: id, limit: 200 });

    return NextResponse.json({ workflow, auditLogs });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
