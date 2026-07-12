import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import { MockComment } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

function extractMentions(content: string): string[] {
  const regex = /@(\w+)/g;
  const matches = content.match(regex);
  return matches ? [...new Set(matches.map(m => m.slice(1)))] : [];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json({ message: "entityType et entityId requis" }, { status: 400 });
    }

    let comments;
    try {
      await connectDB();
      comments = await Comment.find({ entityType, entityId })
        .sort({ createdAt: 1 }).lean();
    } catch {
      comments = await MockComment.find(entityType, entityId);
    }
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { entityType, entityId, content, entityName } = await request.json();

    if (!entityType || !entityId || !content?.trim()) {
      return NextResponse.json({ message: "Champs requis manquants" }, { status: 400 });
    }

    const mentions = extractMentions(content);
    const userName = session.user.name || "";
    const userEmail = session.user.email || "";

    let comment;
    try {
      await connectDB();
      comment = await Comment.create({
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
        userName,
        entityType, entityId, content, mentions,
      });
    } catch {
      comment = await MockComment.create({
        workspaceId: session.user.workspaceId,
        userId: session.user.id, userName,
        entityType, entityId, content, mentions,
      });
    }

    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName,
      userEmail,
      entityType: "comment",
      entityId: comment._id.toString(),
      entityName: entityName || `${entityType}:${entityId}`,
      action: "commented",
      description: `${userName} a commenté sur ${entityType} "${entityName || entityId}"`,
    });

    // Notify mentioned users
    if (mentions.length > 0) {
      try {
        await connectDB();
        const User = (await import("@/models/User")).default;
        for (const mention of mentions) {
          const mentionedUser = await User.findOne({
            $or: [
              { prenom: { $regex: new RegExp(`^${mention}$`, "i") } },
              { nom: { $regex: new RegExp(`^${mention}$`, "i") } },
            ],
          });
          if (mentionedUser && mentionedUser._id.toString() !== session.user.id) {
            await createNotification({
              workspaceId: session.user.workspaceId,
              userId: mentionedUser._id.toString(),
              type: "mention",
              title: `${userName} vous a mentionné`,
              message: content,
              link: `/dashboard/${entityType === "project" ? "projects" : entityType === "task" ? "tasks" : "clients"}/${entityId}`,
              entityType, entityId,
              fromUserId: session.user.id,
              fromUserName: userName,
            });
          }
        }
      } catch {
        const { MockUser } = await import("@/lib/mock-db");
        for (const mention of mentions) {
          const mentionedUser = await MockUser.findOne({ email: mention });
          if (mentionedUser && mentionedUser._id !== session.user.id) {
            await createNotification({
              workspaceId: session.user.workspaceId,
              userId: mentionedUser._id,
              type: "mention",
              title: `${userName} vous a mentionné`,
              message: content,
              link: `/dashboard/${entityType === "project" ? "projects" : entityType === "task" ? "tasks" : "clients"}/${entityId}`,
              entityType, entityId,
              fromUserId: session.user.id,
              fromUserName: userName,
            });
          }
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
