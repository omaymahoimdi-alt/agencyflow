import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { slugify } from "@/lib/slug";
import Portfolio from "@/models/Portfolio";
import User from "@/models/User";
import Invitation from "@/models/Invitation";
import { MockUser, MockPortfolio, MockInvitation, MockTeam } from "@/lib/mock-db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      invitationToken?: string;
    };

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ message: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    let role = "Développeur";

    if (body.invitationToken) {
      let invitation;
      try {
        await connectDB();
        invitation = await Invitation.findOne({ token: body.invitationToken });
      } catch {
        invitation = await MockInvitation.findOne({ token: body.invitationToken });
      }

      if (!invitation || invitation.statut !== "En attente") {
        return NextResponse.json({ message: "Invitation invalide ou déjà utilisée." }, { status: 400 });
      }

      if (new Date(invitation.expiration) < new Date()) {
        return NextResponse.json({ message: "Cette invitation a expiré." }, { status: 410 });
      }

      role = invitation.role || "Développeur";
    }

    // Try MongoDB first, fall back to mock DB
    let existingUser;
    try {
      await connectDB();
      existingUser = await User.findOne({ email: body.email.toLowerCase() });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB");
      existingUser = await MockUser.findOne({ email: body.email.toLowerCase() });
    }

    if (existingUser) {
      return NextResponse.json({ message: "Cet email existe deja." }, { status: 409 });
    }

    const hashedPassword = await hash(body.password, 10);
    let user;
    let slug = slugify(body.name);
    let counter = 1;

    try {
      // Try MongoDB first
      user = await User.create({
        name: body.name,
        email: body.email.toLowerCase(),
        password: hashedPassword,
        role,
      });

      while (await Portfolio.exists({ slug })) {
        slug = `${slugify(body.name)}-${counter}`;
        counter += 1;
      }

      await Portfolio.create({
        userId: user._id,
        title: `Portfolio de ${body.name}`,
        slug,
        bio: "",
        theme: "light",
        primaryColor: "#6366f1",
        isPublished: false,
        views: 0,
      });

      if (body.invitationToken) {
        await Invitation.findOneAndUpdate(
          { token: body.invitationToken },
          { statut: "Acceptée" }
        );
      }
    } catch (dbError) {
      // Fall back to mock DB
      console.log("Using mock DB for registration");
      user = await MockUser.create({
        name: body.name,
        email: body.email.toLowerCase(),
        password: hashedPassword,
        role,
      });

      while (await MockPortfolio.exists({ slug })) {
        slug = `${slugify(body.name)}-${counter}`;
        counter += 1;
      }

      await MockPortfolio.create({
        userId: user._id,
        title: `Portfolio de ${body.name}`,
        slug,
        bio: "",
        theme: "light",
        primaryColor: "#6366f1",
        isPublished: false,
        views: 0,
      });

      if (body.invitationToken) {
        await MockInvitation.findOneAndUpdate(
          { token: body.invitationToken },
          { statut: "Acceptée" }
        );
      }
    }

    return NextResponse.json({ message: "Compte cree avec succes." }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    let errorMessage = "Erreur lors de l'inscription. Veuillez reessayer.";
    
    if (error.message) {
      errorMessage = `Erreur: ${error.message}`;
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
