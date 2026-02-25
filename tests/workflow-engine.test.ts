import {
  createNewWorkflow,
  executeWorkflow,
  getWorkflowById,
} from "@/engine/workflow-engine";
import type { WorkflowDefinition } from "@/types";

const simpleWorkflow: WorkflowDefinition = {
  name: "Test Simple Transfer",
  description: "Single-step transfer for testing",
  sourceAddress: "0xTestSource",
  destinationAddress: "0xTestDest",
  steps: [
    {
      type: "transfer",
      chain: "chain_a",
      token: "USDC",
      amount: 50,
    },
  ],
};

const multiStepWorkflow: WorkflowDefinition = {
  name: "Test Multi-Step",
  description: "Multi-step workflow for testing",
  sourceAddress: "0xTestSource",
  destinationAddress: "0xTestDest",
  steps: [
    { type: "onramp", chain: "chain_a", token: "USDC", amount: 100 },
    {
      type: "bridge",
      chain: "chain_a",
      destinationChain: "chain_b",
      token: "USDC",
      amount: 100,
    },
    {
      type: "swap",
      chain: "chain_b",
      token: "USDC",
      destinationToken: "WETH",
      amount: 100,
    },
    {
      type: "transfer",
      chain: "chain_b",
      token: "WETH",
      amount: 100,
      toAddress: "0xTestDest",
    },
  ],
};

describe("WorkflowEngine", () => {
  describe("workflow creation", () => {
    it("should create a workflow with CREATED status", async () => {
      const workflow = await createNewWorkflow(simpleWorkflow);

      expect(workflow.id).toMatch(/^wf_/);
      expect(workflow.status).toBe("CREATED");
      expect(workflow.totalSteps).toBe(1);
      expect(workflow.currentStep).toBe(0);
      expect(workflow.name).toBe("Test Simple Transfer");
    });

    it("should persist the workflow and retrieve it by ID", async () => {
      const workflow = await createNewWorkflow(simpleWorkflow);
      const retrieved = getWorkflowById(workflow.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(workflow.id);
      expect(retrieved!.definition.steps).toHaveLength(1);
    });
  });

  describe("workflow execution", () => {
    it("should execute a single-step workflow to completion or withdrawal", async () => {
      const workflow = await createNewWorkflow(simpleWorkflow);
      const result = await executeWorkflow(workflow.id);

      expect(["COMPLETED", "WITHDRAWN"]).toContain(result.status);

      if (result.status === "COMPLETED") {
        expect(result.stepResults).toHaveLength(1);
        expect(result.stepResults[0].status).toBe("COMPLETED");
        expect(result.completedAt).toBeDefined();
      }
    }, 60000);

    it("should execute a multi-step workflow", async () => {
      const workflow = await createNewWorkflow(multiStepWorkflow);
      const result = await executeWorkflow(workflow.id);

      expect(["COMPLETED", "WITHDRAWN"]).toContain(result.status);

      if (result.status === "COMPLETED") {
        expect(result.stepResults).toHaveLength(4);
        result.stepResults.forEach((step) => {
          expect(step.status).toBe("COMPLETED");
          expect(step.durationMs).toBeGreaterThan(0);
        });
      }
    }, 120000);

    it("should not re-execute a completed workflow", async () => {
      const workflow = await createNewWorkflow(simpleWorkflow);
      const first = await executeWorkflow(workflow.id);

      if (first.status === "COMPLETED") {
        const second = await executeWorkflow(workflow.id);
        expect(second.status).toBe("COMPLETED");
        expect(second.updatedAt).toBe(first.updatedAt);
      }
    }, 60000);
  });

  describe("concurrent workflows", () => {
    it("should handle multiple workflows independently", async () => {
      const wf1 = await createNewWorkflow({
        ...simpleWorkflow,
        name: "Concurrent Test 1",
      });
      const wf2 = await createNewWorkflow({
        ...simpleWorkflow,
        name: "Concurrent Test 2",
      });

      const [r1, r2] = await Promise.all([
        executeWorkflow(wf1.id),
        executeWorkflow(wf2.id),
      ]);

      expect(r1.id).not.toBe(r2.id);
      expect(["COMPLETED", "WITHDRAWN"]).toContain(r1.status);
      expect(["COMPLETED", "WITHDRAWN"]).toContain(r2.status);
    }, 60000);
  });
});
