import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      message: "MongoDB connecte avec succes.",
      uri_start: process.env.MONGODB_URI?.substring(0, 50),
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        message: "Erreur de connexion a MongoDB.",
        error,
        uri_start: process.env.MONGODB_URI?.substring(0, 50),
      },
      { status: 500 }
    );
  }
}
