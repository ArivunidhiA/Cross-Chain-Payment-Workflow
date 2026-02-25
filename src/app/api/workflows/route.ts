import { NextRequest, NextResponse } from "next/server";
import { listWorkflows } from "@/db/store";
import { createNewWorkflow } from "@/engine/workflow-engine";
import { getTemplate, WORKFLOW_TEMPLATES } from "@/engine/templates";
import type { WorkflowStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as WorkflowStatus | null;
    const limit = parseInt(searchParams.get("limit") || "50");

    const workflows = await listWorkflows(status || undefined, limit);

    return NextResponse.json({
      workflows,
      templates: WORKFLOW_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, definition } = body;

    let workflowDef;
    if (templateId) {
      const template = getTemplate(templateId);
      if (!template) {
        return NextResponse.json(
          { error: `Unknown template: ${templateId}` },
          { status: 400 }
        );
      }
      workflowDef = template.definition;
    } else if (definition) {
      workflowDef = definition;
    } else {
      return NextResponse.json(
        { error: "Provide templateId or definition" },
        { status: 400 }
      );
    }

    const workflow = await createNewWorkflow(workflowDef);
    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
