import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { hash } from "bcryptjs";
import Portfolio from "@/models/Portfolio";
import Skill from "@/models/Skill";
import User from "@/models/User";
import { MockUser, MockPortfolio, MockSkill } from "@/lib/mock-db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    let skill;

    try {
      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
      }
      const portfolio = await Portfolio.findOne({ userId: user._id });
      if (!portfolio) {
        return NextResponse.json({ message: "Portfolio non trouvé" }, { status: 404 });
      }

      skill = await Skill.findOneAndUpdate(
        { _id: id, portfolioId: portfolio._id },
        body,
        { new: true }
      );

      if (!skill) {
        return NextResponse.json({ message: "Compétence non trouvée" }, { status: 404 });
      }
    } catch (dbError) {
      console.log("Using mock DB for skills PUT");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (skills PUT):", session.user.email);
        const hashedPassword = await hash("password123", 10);
        mockUser = await MockUser.create({
          name: session.user.name || "User",
          email: session.user.email.toLowerCase(),
          password: hashedPassword,
          role: "freelance",
        });
      }
      
      let portfolio = await MockPortfolio.findOne({ userId: mockUser._id });
      if (!portfolio) {
        portfolio = await MockPortfolio.create({
          userId: mockUser._id,
          title: `Portfolio de ${mockUser.name}`,
          slug: mockUser.email.split('@')[0].toLowerCase(),
          bio: '',
          theme: 'light',
          primaryColor: '#6366f1',
          isPublished: false,
          views: 0
        });
      }

      const mockSkill = await MockSkill.findById(id);
      if (!mockSkill || mockSkill.portfolioId !== portfolio._id) {
        return NextResponse.json({ message: "Compétence non trouvée" }, { status: 404 });
      }

      skill = await MockSkill.findByIdAndUpdate(id, body);
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error("Error updating skill:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    try {
      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
      }
      const portfolio = await Portfolio.findOne({ userId: user._id });
      if (!portfolio) {
        return NextResponse.json({ message: "Portfolio non trouvé" }, { status: 404 });
      }

      const skill = await Skill.findOneAndDelete({ _id: id, portfolioId: portfolio._id });
      if (!skill) {
        return NextResponse.json({ message: "Compétence non trouvée" }, { status: 404 });
      }
    } catch (dbError) {
      console.log("Using mock DB for skills DELETE");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (skills DELETE):", session.user.email);
        const hashedPassword = await hash("password123", 10);
        mockUser = await MockUser.create({
          name: session.user.name || "User",
          email: session.user.email.toLowerCase(),
          password: hashedPassword,
          role: "freelance",
        });
      }
      
      let portfolio = await MockPortfolio.findOne({ userId: mockUser._id });
      if (!portfolio) {
        portfolio = await MockPortfolio.create({
          userId: mockUser._id,
          title: `Portfolio de ${mockUser.name}`,
          slug: mockUser.email.split('@')[0].toLowerCase(),
          bio: '',
          theme: 'light',
          primaryColor: '#6366f1',
          isPublished: false,
          views: 0
        });
      }

      const mockSkill = await MockSkill.findById(id);
      if (!mockSkill || mockSkill.portfolioId !== portfolio._id) {
        return NextResponse.json({ message: "Compétence non trouvée" }, { status: 404 });
      }

      await MockSkill.findByIdAndDelete(id);
    }

    return NextResponse.json({ message: "Compétence supprimée" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
