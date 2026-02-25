import { StateMachine } from "@/engine/state-machine";

describe("StateMachine", () => {
  describe("workflow transitions", () => {
    it("should allow CREATED -> PENDING", () => {
      expect(StateMachine.canTransitionWorkflow("CREATED", "PENDING")).toBe(
        true
      );
    });

    it("should allow PENDING -> EXECUTING", () => {
      expect(StateMachine.canTransitionWorkflow("PENDING", "EXECUTING")).toBe(
        true
      );
    });

    it("should allow EXECUTING -> COMPLETED", () => {
      expect(
        StateMachine.canTransitionWorkflow("EXECUTING", "COMPLETED")
      ).toBe(true);
    });

    it("should allow EXECUTING -> FAILED", () => {
      expect(StateMachine.canTransitionWorkflow("EXECUTING", "FAILED")).toBe(
        true
      );
    });

    it("should allow EXECUTING -> RECOVERING", () => {
      expect(
        StateMachine.canTransitionWorkflow("EXECUTING", "RECOVERING")
      ).toBe(true);
    });

    it("should allow RECOVERING -> EXECUTING (resume after recovery)", () => {
      expect(
        StateMachine.canTransitionWorkflow("RECOVERING", "EXECUTING")
      ).toBe(true);
    });

    it("should allow FAILED -> WITHDRAWAL_PENDING", () => {
      expect(
        StateMachine.canTransitionWorkflow("FAILED", "WITHDRAWAL_PENDING")
      ).toBe(true);
    });

    it("should reject invalid transition CREATED -> COMPLETED", () => {
      expect(
        StateMachine.canTransitionWorkflow("CREATED", "COMPLETED")
      ).toBe(false);
    });

    it("should reject COMPLETED -> anything (terminal state)", () => {
      expect(
        StateMachine.canTransitionWorkflow("COMPLETED", "EXECUTING")
      ).toBe(false);
      expect(
        StateMachine.canTransitionWorkflow("COMPLETED", "PENDING")
      ).toBe(false);
    });

    it("should reject WITHDRAWN -> anything (terminal state)", () => {
      expect(
        StateMachine.canTransitionWorkflow("WITHDRAWN", "EXECUTING")
      ).toBe(false);
    });

    it("should throw on invalid transition via transitionWorkflow()", () => {
      expect(() =>
        StateMachine.transitionWorkflow("CREATED", "COMPLETED")
      ).toThrow("Invalid workflow transition");
    });

    it("should return target state on valid transition", () => {
      expect(StateMachine.transitionWorkflow("CREATED", "PENDING")).toBe(
        "PENDING"
      );
    });
  });

  describe("step transitions", () => {
    it("should allow PENDING -> EXECUTING", () => {
      expect(StateMachine.canTransitionStep("PENDING", "EXECUTING")).toBe(
        true
      );
    });

    it("should allow EXECUTING -> COMPLETED", () => {
      expect(StateMachine.canTransitionStep("EXECUTING", "COMPLETED")).toBe(
        true
      );
    });

    it("should allow EXECUTING -> FAILED", () => {
      expect(StateMachine.canTransitionStep("EXECUTING", "FAILED")).toBe(
        true
      );
    });

    it("should allow FAILED -> RECOVERING", () => {
      expect(StateMachine.canTransitionStep("FAILED", "RECOVERING")).toBe(
        true
      );
    });

    it("should reject COMPLETED -> anything (terminal)", () => {
      expect(StateMachine.canTransitionStep("COMPLETED", "FAILED")).toBe(
        false
      );
    });
  });

  describe("terminal state detection", () => {
    it("should detect COMPLETED as terminal workflow state", () => {
      expect(StateMachine.isTerminalWorkflowState("COMPLETED")).toBe(true);
    });

    it("should detect WITHDRAWN as terminal workflow state", () => {
      expect(StateMachine.isTerminalWorkflowState("WITHDRAWN")).toBe(true);
    });

    it("should not detect EXECUTING as terminal workflow state", () => {
      expect(StateMachine.isTerminalWorkflowState("EXECUTING")).toBe(false);
    });

    it("should detect COMPLETED as terminal step state", () => {
      expect(StateMachine.isTerminalStepState("COMPLETED")).toBe(true);
    });

    it("should detect SKIPPED as terminal step state", () => {
      expect(StateMachine.isTerminalStepState("SKIPPED")).toBe(true);
    });
  });

  describe("full lifecycle", () => {
    it("should allow a complete happy-path lifecycle", () => {
      let state = StateMachine.transitionWorkflow("CREATED", "PENDING");
      expect(state).toBe("PENDING");

      state = StateMachine.transitionWorkflow(state, "EXECUTING");
      expect(state).toBe("EXECUTING");

      state = StateMachine.transitionWorkflow(state, "COMPLETED");
      expect(state).toBe("COMPLETED");

      expect(StateMachine.isTerminalWorkflowState(state)).toBe(true);
    });

    it("should allow a failure -> recovery -> completion lifecycle", () => {
      let state = StateMachine.transitionWorkflow("CREATED", "PENDING");
      state = StateMachine.transitionWorkflow(state, "EXECUTING");
      state = StateMachine.transitionWorkflow(state, "RECOVERING");
      expect(state).toBe("RECOVERING");

      state = StateMachine.transitionWorkflow(state, "EXECUTING");
      expect(state).toBe("EXECUTING");

      state = StateMachine.transitionWorkflow(state, "COMPLETED");
      expect(state).toBe("COMPLETED");
    });

    it("should allow a failure -> withdrawal lifecycle", () => {
      let state = StateMachine.transitionWorkflow("CREATED", "PENDING");
      state = StateMachine.transitionWorkflow(state, "EXECUTING");
      state = StateMachine.transitionWorkflow(state, "FAILED");
      state = StateMachine.transitionWorkflow(state, "WITHDRAWAL_PENDING");
      state = StateMachine.transitionWorkflow(state, "WITHDRAWN");
      expect(state).toBe("WITHDRAWN");
      expect(StateMachine.isTerminalWorkflowState(state)).toBe(true);
    });
  });
});
