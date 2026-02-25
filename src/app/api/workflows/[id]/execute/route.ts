import { NextRequest, NextResponse } from "next/server";
import { getWorkflow } from "@/db/store";
import { executeWorkflow } from "@/engine/workflow-engine";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = getWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (
      workflow.status === "COMPLETED" ||
      workflow.status === "WITHDRAWN"
    ) {
      return NextResponse.json(
        { error: `Workflow already in terminal state: ${workflow.status}` },
        { status: 400 }
      );
    }

    if (
      workflow.status === "EXECUTING" ||
      workflow.status === "RECOVERING"
    ) {
      return NextResponse.json(
        { error: "Workflow is already executing" },
        { status: 409 }
      );
    }

    // Fire-and-forget: execute in background so client can poll
    executeWorkflow(id).catch((err) => {
      console.error(`Workflow ${id} execution error:`, err);
    });

    return NextResponse.json({
      message: "Execution started",
      workflowId: id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
