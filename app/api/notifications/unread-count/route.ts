import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { MockNotification } from "@/lib/mock-db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    let count: number;
    try {
      await connectDB();
      count = await Notification.countDocuments({ userId: session.user.id, read: false });
    } catch {
      count = await MockNotification.countUnread(session.user.id);
    }
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ count: 0 });
  }
}
