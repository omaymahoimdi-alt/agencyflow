import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DiscussionMessage from "@/models/DiscussionMessage";
import { MockDiscussion } from "@/lib/mock-db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    let messages: any[] = [];
    try {
      await connectDB();
      const filter: any = { projectId };
      if (channelId) filter.channelId = channelId;
      messages = await DiscussionMessage.find(filter).sort({ time: 1 }).lean() as any[];
    } catch {
      if (channelId) {
        messages = await MockDiscussion.findByChannel(projectId, channelId) as any[];
      }
    }
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching discussion messages:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id: projectId } = await params;
    const { channelId, content, parentId, attachments, mentions } = await request.json();

    if (!channelId || !content?.trim()) {
      return NextResponse.json({ message: "channelId et content requis" }, { status: 400 });
    }

    const userName = session.user.name || "Utilisateur";
    const userEmail = session.user.email || "";
    const userAvatar = userName.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2) || "U";

    let message: any;
    try {
      await connectDB();
      const doc = await DiscussionMessage.create({
        channelId,
        projectId,
        userId: session.user.id,
        userName,
        userEmail,
        userAvatar,
        content: content.trim(),
        time: new Date().toISOString(),
        reactions: [],
        pinned: false,
        edited: false,
        parentId: parentId || undefined,
        attachments: attachments || undefined,
        mentions: mentions || [],
      });
      message = doc.toObject();
    } catch {
      message = await MockDiscussion.create({
        channelId,
        projectId,
        userId: session.user.id,
        userName,
        userEmail,
        userAvatar,
        content: content.trim(),
        parentId: parentId || undefined,
        attachments: attachments || undefined,
        mentions: mentions || [],
      });
    }
    return NextResponse.json({ ...message, id: message._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating discussion message:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("id");
    if (!messageId) {
      return NextResponse.json({ message: "id requis" }, { status: 400 });
    }

    const updates = await request.json();
    let message: any;
    try {
      await connectDB();
      message = await DiscussionMessage.findByIdAndUpdate(
        messageId, { ...updates, updatedAt: new Date().toISOString() }, { new: true }
      ).lean();
    } catch {
      message = await MockDiscussion.update(messageId, updates);
    }
    if (!message) {
      return NextResponse.json({ message: "Message non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ ...message, id: message._id });
  } catch (error) {
    console.error("Error updating discussion message:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("id");
    if (!messageId) {
      return NextResponse.json({ message: "id requis" }, { status: 400 });
    }

    let deleted: any;
    try {
      await connectDB();
      deleted = await DiscussionMessage.findByIdAndDelete(messageId).lean();
    } catch {
      deleted = await MockDiscussion.deleteById(messageId);
    }
    if (!deleted) {
      return NextResponse.json({ message: "Message non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ message: "Message supprimé" });
  } catch (error) {
    console.error("Error deleting discussion message:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
