import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { hash } from "bcryptjs";
import Portfolio from "@/models/Portfolio";
import Experience from "@/models/Experience";
import User from "@/models/User";
import { MockUser, MockPortfolio, MockExperience } from "@/lib/mock-db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    let portfolio;
    let experiences;

    try {
      await connectDB();
      let user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
      }
      portfolio = await Portfolio.findOne({ userId: user._id });
      if (!portfolio) {
        portfolio = await Portfolio.create({
          userId: user._id,
          title: `Portfolio de ${user.name}`,
          slug: user.email.split('@')[0].toLowerCase(),
          bio: '',
          theme: 'light',
          primaryColor: '#6366f1',
          isPublished: false,
          views: 0
        });
      }
      experiences = await Experience.find({ portfolioId: portfolio._id });
    } catch (dbError) {
      console.log("Using mock DB for experiences GET");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (experiences GET):", session.user.email);
        const hashedPassword = await hash("password123", 10);
        mockUser = await MockUser.create({
          name: session.user.name || "User",
          email: session.user.email.toLowerCase(),
          password: hashedPassword,
          role: "freelance",
        });
      }
      
      portfolio = await MockPortfolio.findOne({ userId: mockUser._id });
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
      experiences = await MockExperience.find({ portfolioId: portfolio._id });
    }

    return NextResponse.json(experiences);
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, company, startDate, endDate, current, description } = body;

    if (!title || !company || !startDate) {
      return NextResponse.json({ message: "Les champs titre, entreprise et date de début sont requis" }, { status: 400 });
    }

    let portfolio;
    let experience;

    try {
      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
      }
      portfolio = await Portfolio.findOne({ userId: user._id });
      if (!portfolio) {
        return NextResponse.json({ message: "Portfolio non trouvé" }, { status: 404 });
      }
      experience = await Experience.create({
        portfolioId: portfolio._id,
        type: type || "work",
        title,
        company,
        startDate,
        endDate: current ? "" : (endDate || ""),
        current: current || false,
        description: description || "",
      });
    } catch (dbError) {
      console.log("Using mock DB for experiences POST");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (experiences POST):", session.user.email);
        const hashedPassword = await hash("password123", 10);
        mockUser = await MockUser.create({
          name: session.user.name || "User",
          email: session.user.email.toLowerCase(),
          password: hashedPassword,
          role: "freelance",
        });
      }
      
      portfolio = await MockPortfolio.findOne({ userId: mockUser._id });
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
      experience = await MockExperience.create({
        portfolioId: portfolio._id,
        type: type || "work",
        title,
        company,
        startDate,
        endDate: current ? "" : (endDate || ""),
        current: current || false,
        description: description || "",
      });
    }

    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error("Error creating experience:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
