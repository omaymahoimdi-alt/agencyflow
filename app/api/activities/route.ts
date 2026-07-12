import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";
import { MockActivity } from "@/lib/mock-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    let activities, total;
    try {
      await connectDB();
      total = await Activity.countDocuments({ workspaceId: session.user.workspaceId });
      activities = await Activity.find({ workspaceId: session.user.workspaceId })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    } catch {
      const result = await MockActivity.find(session.user.workspaceId, limit, skip);
      activities = result.activities;
      total = result.total;
    }
    return NextResponse.json({ activities, total });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
