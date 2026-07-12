import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { MockUser, MockWorkspaceMember } from "@/lib/mock-db";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { workspaceId } = await request.json();
    if (!workspaceId) {
      return NextResponse.json({ message: "workspaceId requis" }, { status: 400 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Verify the user is a member of this workspace
    let isMember = false;
    try {
      await connectDB();
      const { default: WorkspaceMember } = await import("@/models/WorkspaceMember");
      const member = await WorkspaceMember.findOne({ userId, workspaceId });
      if (member) isMember = true;
    } catch { /* fall through */ }
    if (!isMember) {
      // Find mock user by email (IDs may differ from MongoDB)
      if (userEmail) {
        const mockUser = await MockUser.findOne({ email: userEmail.toLowerCase() });
        // Check by mock user ID first, then by session userId as fallback
        const idsToCheck = mockUser ? [mockUser._id, userId] : [userId];
        for (const id of [...new Set(idsToCheck)]) {
          const mockMembers = await MockWorkspaceMember.find({ userId: id });
          if (mockMembers.some((m: any) => m.workspaceId === workspaceId)) {
            isMember = true;
            break;
          }
        }
      }
    }

    if (!isMember) {
      return NextResponse.json({ message: "Vous n'êtes pas membre de cet espace de travail" }, { status: 403 });
    }

    // Update activeWorkspaceId in both DBs
    try {
      await connectDB();
      await User.findByIdAndUpdate(userId, { activeWorkspaceId: workspaceId });
    } catch { /* fall through */ }
    try {
      if (userEmail) {
        const mockUser = await MockUser.findOne({ email: userEmail.toLowerCase() });
        if (mockUser) {
          await MockUser.updateOne({ _id: mockUser._id }, { activeWorkspaceId: workspaceId });
        }
      }
    } catch { /* ignore */ }

    return NextResponse.json({ success: true, workspaceId });
  } catch (error) {
    console.error("Switch workspace error:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
