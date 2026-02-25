import type { WorkflowTemplateDefinition } from "@/types";

export const WORKFLOW_TEMPLATES: WorkflowTemplateDefinition[] = [
  {
    id: "cross_chain_swap",
    name: "Cross-Chain Swap",
    description:
      "Onramp $100 USDC on Chain A, bridge to Chain B, swap to WETH, transfer to destination",
    definition: {
      name: "Cross-Chain Swap",
      description:
        "Onramp → Bridge → Swap → Transfer across Chain A and Chain B",
      sourceAddress: "0xSourceWallet001",
      destinationAddress: "0xDestWallet001",
      steps: [
        {
          type: "onramp",
          chain: "chain_a",
          token: "USDC",
          amount: 100,
        },
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
          toAddress: "0xDestWallet001",
        },
      ],
    },
  },
  {
    id: "multi_hop",
    name: "Multi-Hop Transfer",
    description:
      "Bridge USDC from Chain A to Chain C, swap to target token, transfer to destination",
    definition: {
      name: "Multi-Hop Transfer",
      description:
        "Bridge A→C → Swap on C → Transfer on C (tests Chain C reliability)",
      sourceAddress: "0xSourceWallet002",
      destinationAddress: "0xDestWallet002",
      steps: [
        {
          type: "bridge",
          chain: "chain_a",
          destinationChain: "chain_c",
          token: "USDC",
          amount: 250,
        },
        {
          type: "swap",
          chain: "chain_c",
          token: "USDC",
          destinationToken: "AVAX",
          amount: 250,
        },
        {
          type: "transfer",
          chain: "chain_c",
          token: "AVAX",
          amount: 250,
          toAddress: "0xDestWallet002",
        },
      ],
    },
  },
  {
    id: "failure_scenario",
    name: "Failure Recovery Test",
    description:
      "Deliberately routes through unreliable chains to test recovery and withdrawal paths",
    definition: {
      name: "Failure Recovery Test",
      description:
        "Bridge A→B → Swap on B → Bridge B→C → Transfer on C (high failure probability)",
      sourceAddress: "0xSourceWallet003",
      destinationAddress: "0xDestWallet003",
      steps: [
        {
          type: "bridge",
          chain: "chain_a",
          destinationChain: "chain_b",
          token: "USDC",
          amount: 500,
        },
        {
          type: "swap",
          chain: "chain_b",
          token: "USDC",
          destinationToken: "DAI",
          amount: 500,
        },
        {
          type: "bridge",
          chain: "chain_b",
          destinationChain: "chain_c",
          token: "DAI",
          amount: 500,
        },
        {
          type: "transfer",
          chain: "chain_c",
          token: "DAI",
          amount: 500,
          toAddress: "0xDestWallet003",
        },
      ],
    },
  },
];

export function getTemplate(
  id: string
): WorkflowTemplateDefinition | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}
