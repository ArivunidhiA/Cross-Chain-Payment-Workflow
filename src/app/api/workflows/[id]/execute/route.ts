import { NextRequest, NextResponse } from "next/server";
import { getWorkflow } from "@/db/store";
import { executeWorkflow } from "@/engine/workflow-engine";

export const maxDuration = 30;

export async function POST(
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

    const completed = await executeWorkflow(id);

    return NextResponse.json({
      message: "Execution completed",
      workflowId: id,
      status: completed.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
