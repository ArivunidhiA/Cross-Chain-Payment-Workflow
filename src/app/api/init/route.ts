import { NextResponse } from "next/server";
import { initializeDatabase } from "@/db/store";

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: "Database initialized successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: "Database initialized successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
