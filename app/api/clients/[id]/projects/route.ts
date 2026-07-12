import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockProject } from "@/lib/mock-db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const allProjects = await MockProject.find(session?.user?.workspaceId);
    const projects = allProjects.filter(
      (p: any) => p.clientId && p.clientId._id === id
    );
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching client projects:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
