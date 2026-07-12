import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { MockSettings } from "@/lib/mock-db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    try {
      await connectDB();
      let settings = await Settings.findOne({ workspaceId: session.user.workspaceId });
      if (!settings) {
        settings = await Settings.create({
          nomAgence: "AgencyFlow",
          emailAgence: "",
          telephoneAgence: "",
          logo: "",
          theme: "light",
          couleur: "#7C3AED",
          workspaceId: session.user.workspaceId,
        });
      }
      return NextResponse.json(settings);
    } catch (dbError) {
      let settings = await MockSettings.findOne({ workspaceId: session.user.workspaceId });
      if (!settings) {
        settings = await MockSettings.create({
          nomAgence: "AgencyFlow",
          emailAgence: "contact@agencyflow.com",
          telephoneAgence: "+212 5 22 12 34 56",
          logo: "",
          theme: "light",
          couleur: "#7C3AED",
          notifEmail: true,
          notifRappels: true,
          notifEcheances: false,
          notifCommentaires: true,
          workspaceId: session.user.workspaceId,
        });
      }
      return NextResponse.json(settings);
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    try {
      await connectDB();
      let settings = await Settings.findOne({ workspaceId: session.user.workspaceId });
      if (!settings) {
        settings = await Settings.create({ ...body, workspaceId: session.user.workspaceId });
      } else {
        settings = await Settings.findOneAndUpdate({ workspaceId: session.user.workspaceId }, body, { new: true });
      }
      return NextResponse.json(settings);
    } catch (dbError) {
      let settings = await MockSettings.findOne({ workspaceId: session.user.workspaceId });
      if (!settings) {
        settings = await MockSettings.create({ ...body, workspaceId: session.user.workspaceId });
      } else {
        settings = await MockSettings.findOneAndUpdate({ workspaceId: session.user.workspaceId }, body);
      }
      return NextResponse.json(settings);
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
