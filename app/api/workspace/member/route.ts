import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ workspaces: [] });
    }

    const workspaces = (session.user as any).workspaceIds || [];
    return NextResponse.json({ workspaces });
  } catch {
    return NextResponse.json({ workspaces: [] });
  }
}
