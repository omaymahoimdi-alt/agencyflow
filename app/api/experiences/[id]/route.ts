import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { hash } from "bcryptjs";
import Portfolio from "@/models/Portfolio";
import Experience from "@/models/Experience";
import User from "@/models/User";
import { MockUser, MockPortfolio, MockExperience } from "@/lib/mock-db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    let experience;

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

      experience = await Experience.findOneAndUpdate(
        { _id: id, portfolioId: portfolio._id },
        body,
        { new: true }
      );

      if (!experience) {
        return NextResponse.json({ message: "Expérience non trouvée" }, { status: 404 });
      }
    } catch (dbError) {
      console.log("Using mock DB for experiences PUT");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (experiences PUT):", session.user.email);
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

      const mockExp = await MockExperience.findById(id);
      if (!mockExp || mockExp.portfolioId !== portfolio._id) {
        return NextResponse.json({ message: "Expérience non trouvée" }, { status: 404 });
      }

      experience = await MockExperience.findByIdAndUpdate(id, body);
    }

    return NextResponse.json(experience);
  } catch (error) {
    console.error("Error updating experience:", error);
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

      const experience = await Experience.findOneAndDelete({ _id: id, portfolioId: portfolio._id });
      if (!experience) {
        return NextResponse.json({ message: "Expérience non trouvée" }, { status: 404 });
      }
    } catch (dbError) {
      console.log("Using mock DB for experiences DELETE");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (experiences DELETE):", session.user.email);
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

      const mockExp = await MockExperience.findById(id);
      if (!mockExp || mockExp.portfolioId !== portfolio._id) {
        return NextResponse.json({ message: "Expérience non trouvée" }, { status: 404 });
      }

      await MockExperience.findByIdAndDelete(id);
    }

    return NextResponse.json({ message: "Expérience supprimée" });
  } catch (error) {
    console.error("Error deleting experience:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
