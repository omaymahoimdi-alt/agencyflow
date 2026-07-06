import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";
import { MockTeamMessage } from "@/lib/mock-db";

// Try to use MongoDB, fall back to MockDB
async function getDatabase() {
  try {
    await connectDB();
    return { type: "mongo" } as const;
  } catch {
    return { type: "mock" } as const;
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get("with");

    const db = await getDatabase();
    
    if (db.type === "mongo") {
      let filter = {};
      if (withUserId) {
        filter = {
          $or: [
            { expediteurId: userId, destinataireId: withUserId },
            { expediteurId: withUserId, destinataireId: userId },
          ],
        };
      } else {
        filter = {
          $or: [{ expediteurId: userId }, { destinataireId: userId }],
        };
      }

      const messages = await Message.find(filter)
        .populate("expediteurId", "nom prenom photo")
        .populate("destinataireId", "nom prenom photo")
        .sort({ dateEnvoi: 1 });

      return NextResponse.json(messages);
    } else {
      // Use MockDB
      const messages = await MockTeamMessage.find({ with: withUserId || undefined }, userId);
      return NextResponse.json(messages);
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    const { destinataireId, contenu } = body;
    if (!destinataireId || !contenu?.trim()) {
      return NextResponse.json({ message: "Destinataire et contenu requis" }, { status: 400 });
    }

    const db = await getDatabase();
    
    if (db.type === "mongo") {
      const message = await Message.create({
        expediteurId: session.user.id,
        destinataireId,
        contenu: contenu.trim(),
        dateEnvoi: new Date(),
        lu: false,
      });
      const populated = await message.populate([
        { path: "expediteurId", select: "nom prenom photo" },
        { path: "destinataireId", select: "nom prenom photo" },
      ]);
      return NextResponse.json(populated, { status: 201 });
    } else {
      // Use MockDB
      const message = await MockTeamMessage.create({
        expediteurId: session.user.id,
        destinataireId,
        contenu: contenu.trim()
      });
      return NextResponse.json(message, { status: 201 });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    const { messageIds } = body;

    const db = await getDatabase();
    
    if (db.type === "mongo") {
      await Message.updateMany(
        { _id: { $in: messageIds }, destinataireId: session.user.id },
        { lu: true }
      );
    } else {
      // Use MockDB
      await MockTeamMessage.markAsRead(messageIds || [], session.user.id);
    }
    return NextResponse.json({ message: "Messages marqués comme lus" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
