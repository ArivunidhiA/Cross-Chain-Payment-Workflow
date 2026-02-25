import { NextResponse } from "next/server";
import { getAllChainConfigs } from "@/chains/chain-adapters";

export async function GET() {
  try {
    const chains = getAllChainConfigs();

    return NextResponse.json({ chains });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
