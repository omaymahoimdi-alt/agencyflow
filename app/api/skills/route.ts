import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { hash } from "bcryptjs";
import Portfolio from "@/models/Portfolio";
import Skill from "@/models/Skill";
import User from "@/models/User";
import { MockUser, MockPortfolio, MockSkill } from "@/lib/mock-db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    let portfolio;
    let skills;

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
      skills = await Skill.find({ portfolioId: portfolio._id });
    } catch (dbError) {
      console.log("Using mock DB for skills GET");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (skills GET):", session.user.email);
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
      skills = await MockSkill.find({ portfolioId: portfolio._id });
    }

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
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
    const { name, category, level, icon } = body;

    if (!name) {
      return NextResponse.json({ message: "Le nom est requis" }, { status: 400 });
    }

    let portfolio;
    let skill;

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
      skill = await Skill.create({
        portfolioId: portfolio._id,
        name,
        category: category || "Frontend",
        level: level || 50,
        icon: icon || "",
      });
    } catch (dbError) {
      console.log("Using mock DB for skills POST");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (skills POST):", session.user.email);
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
      skill = await MockSkill.create({
        portfolioId: portfolio._id,
        name,
        category: category || "Frontend",
        level: level || 50,
        icon: icon || "",
      });
    }

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
