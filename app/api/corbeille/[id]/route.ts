import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockCorbeille } from "@/lib/mock-db";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const deleted = await MockCorbeille.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Élément non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ message: "Élément supprimé" });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
