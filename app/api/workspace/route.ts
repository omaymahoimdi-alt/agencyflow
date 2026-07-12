import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Workspace from "@/models/Workspace";
import WorkspaceMember from "@/models/WorkspaceMember";
import { MockWorkspace, MockWorkspaceMember, MockUser, MockTeam } from "@/lib/mock-db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ nom: "Mon agence" });
    }

    const workspaceId = session.user.workspaceId;
    const workspace = await MockWorkspace.findOne({ _id: workspaceId });
    if (workspace) return NextResponse.json({ nom: workspace.nom, _id: workspace._id });

    return NextResponse.json({ nom: "Mon agence" });
  } catch {
    return NextResponse.json({ nom: "Mon agence" });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { nom } = await request.json();
    if (!nom || typeof nom !== "string" || !nom.trim()) {
      return NextResponse.json({ message: "Le nom de l'espace est requis" }, { status: 400 });
    }

    const userId = session.user.id;
    const workspaceName = nom.trim();
    let createdWsId: string | undefined;

    // Create in MongoDB
    try {
      await connectDB();
      const dbUser = await (await import("@/models/User")).default.findById(userId);
      if (dbUser) {
        const ws = await Workspace.create({
          nom: workspaceName,
          ownerId: dbUser._id,
          description: `Espace de travail de ${dbUser.name || dbUser.email}`,
        });
        await WorkspaceMember.create({
          workspaceId: ws._id,
          userId: dbUser._id,
          role: "Owner",
          status: "Actif",
        });
        createdWsId = ws._id.toString();
      }
    } catch { /* fall through */ }

    // Create in mock DB
    try {
      const mockUser = await MockUser.findById(userId);
      if (mockUser) {
        const ws = await MockWorkspace.create({
          nom: workspaceName,
          ownerId: mockUser._id,
          description: `Espace de travail de ${mockUser.name || mockUser.email}`,
        });
        await MockWorkspaceMember.create({
          workspaceId: ws._id,
          userId: mockUser._id,
          role: "Owner",
          status: "Actif",
        });
        // Ensure MockTeam entry
        const allTeam = await MockTeam.find();
        const inTeam = allTeam.some((t: any) => t.email.toLowerCase() === mockUser.email.toLowerCase());
        if (!inTeam) {
          const nameParts = (mockUser.name || "Utilisateur").split(" ");
          await MockTeam.create({
            nom: nameParts.slice(1).join(" ") || "Inconnu",
            prenom: nameParts[0] || "Utilisateur",
            email: mockUser.email.toLowerCase(),
            password: mockUser.password || "",
            role: "Admin",
            userId: mockUser._id,
            workspaceId: ws._id,
          });
        }
        if (!createdWsId) createdWsId = ws._id;
      }
    } catch { /* ignore */ }

    if (!createdWsId) {
      return NextResponse.json({ message: "Erreur lors de la création" }, { status: 500 });
    }

    return NextResponse.json({ success: true, workspaceId: createdWsId });
  } catch (error) {
    console.error("Create workspace error:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
