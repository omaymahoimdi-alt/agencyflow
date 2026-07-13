import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Corbeille from "@/models/Corbeille";
import { MockCorbeille } from "@/lib/mock-db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;
    const seen = new Set<string>();
    const all: any[] = [];

    // Try MongoDB first
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const filter: any = {};
        if (workspaceId) filter.workspaceId = workspaceId;
        const docs = await Corbeille.find(filter).sort({ supprimeLe: -1 }).lean();
        for (const d of docs) {
          const item = {
            id: d.corbeilleId,
            type: d.type,
            nom: d.nom,
            supprimePar: d.supprimePar,
            supprimeLe: typeof d.supprimeLe === "string" ? d.supprimeLe : d.supprimeLe?.toISOString?.() || String(d.supprimeLe),
            supprimeDefinitivementLe: typeof d.supprimeDefinitivementLe === "string" ? d.supprimeDefinitivementLe : d.supprimeDefinitivementLe?.toISOString?.() || String(d.supprimeDefinitivementLe),
            sourceData: d.sourceData,
            meta: d.meta,
          };
          seen.add(item.id);
          all.push(item);
        }
      } catch (dbError) {
        console.error("Corbeille MongoDB GET failed:", dbError);
      }
    }

    // Also get from MockCorbeille and merge (deduplicate)
    try {
      const mockItems = await MockCorbeille.find(workspaceId);
      for (const item of mockItems) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          all.push(item);
        }
      }
    } catch (e) {
      console.error("Corbeille MockCorbeille GET failed:", e);
    }

    return NextResponse.json(all);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    const item = {
      ...body,
      workspaceId: session.user.workspaceId,
      deletedBy: session.user.id,
    };

    // Write to BOTH MongoDB and MockCorbeille for consistency
    const results: string[] = [];

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        await Corbeille.findOneAndUpdate(
          { corbeilleId: body.id },
          {
            corbeilleId: body.id,
            workspaceId: session.user.workspaceId,
            deletedBy: session.user.id,
            type: body.type,
            nom: body.nom,
            supprimePar: body.supprimePar,
            supprimeLe: new Date(body.supprimeLe),
            supprimeDefinitivementLe: new Date(body.supprimeDefinitivementLe),
            sourceData: body.sourceData,
            meta: body.meta,
          },
          { upsert: true }
        );
        results.push("mongodb");
      } catch (dbError) {
        console.error("Corbeille MongoDB POST failed:", dbError);
      }
    }

    try {
      await MockCorbeille.create(item);
      results.push("mock");
    } catch (e) {
      console.error("Corbeille MockCorbeille POST failed:", e);
    }

    if (results.length === 0) {
      return NextResponse.json({ message: "Erreur lors de l'ajout à la corbeille" }, { status: 500 });
    }

    return NextResponse.json({ id: body.id, type: body.type, nom: body.nom, savedTo: results }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
