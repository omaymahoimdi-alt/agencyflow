import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { MockNotification } from "@/lib/mock-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");

    let notifications, total;
    try {
      await connectDB();
      total = await Notification.countDocuments({ userId: session.user.id });
      notifications = await Notification.find({ userId: session.user.id })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    } catch {
      const result = await MockNotification.find(session.user.id, limit, skip);
      notifications = result.notifications;
      total = result.total;
    }
    return NextResponse.json({ notifications, total });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { ids } = await request.json();

    if (ids === "all") {
      try {
        await connectDB();
        await Notification.updateMany({ userId: session.user.id }, { read: true });
      } catch {
        await MockNotification.updateMany({ userId: session.user.id }, { read: true } as any);
      }
      return NextResponse.json({ message: "Tout marqué comme lu" });
    }

    if (Array.isArray(ids)) {
      try {
        await connectDB();
        await Notification.updateMany({ _id: { $in: ids }, userId: session.user.id }, { read: true });
      } catch {
        for (const id of ids) {
          await MockNotification.findByIdAndUpdate(id, { read: true } as any);
        }
      }
    }
    return NextResponse.json({ message: "Notifications mises à jour" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
