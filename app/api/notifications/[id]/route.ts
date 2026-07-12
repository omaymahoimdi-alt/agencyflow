import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { MockNotification } from "@/lib/mock-db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const { read } = await request.json();

    try {
      await connectDB();
      await Notification.findOneAndUpdate({ _id: id, userId: session.user.id }, { read });
    } catch {
      await MockNotification.findByIdAndUpdate(id, { read } as any);
    }
    return NextResponse.json({ message: "Notification mise à jour" });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
