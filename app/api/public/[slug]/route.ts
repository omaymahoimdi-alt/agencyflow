import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Portfolio from "@/models/Portfolio";
import Project from "@/models/Project";
import Skill from "@/models/Skill";
import Experience from "@/models/Experience";
import Testimonial from "@/models/Testimonial";
import User from "@/models/User";
import {
  MockPortfolio,
  MockPortfolioProject,
  MockSkill,
  MockExperience,
  MockTestimonial,
  MockUser,
} from "@/lib/mock-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let portfolio: any;
    let user: any;
    let projects: any[] = [];
    let skills: any[] = [];
    let experiences: any[] = [];
    let testimonials: any[] = [];

    try {
      await connectDB();

      portfolio = await Portfolio.findOne({ slug });
      if (!portfolio) {
        return NextResponse.json({ message: "Portfolio introuvable" }, { status: 404 });
      }

      user = await User.findById(portfolio.userId).select("name avatar email");

      [projects, skills, experiences, testimonials] = await Promise.all([
        Project.find({ portfolioId: portfolio._id, isPublished: true }).sort({ order: 1 }),
        Skill.find({ portfolioId: portfolio._id }),
        Experience.find({ portfolioId: portfolio._id }).sort({ startDate: -1 }),
        Testimonial.find({ portfolioId: portfolio._id, isApproved: true }),
      ]);
    } catch {
      // Fallback to mock DB
      portfolio = await MockPortfolio.findOne({ slug });
      if (!portfolio) {
        return NextResponse.json({ message: "Portfolio introuvable" }, { status: 404 });
      }

      user = await MockUser.findOne({ email: "" }); // best effort
      [projects, skills, experiences, testimonials] = await Promise.all([
        MockPortfolioProject.find({ portfolioId: portfolio._id }),
        MockSkill.find({ portfolioId: portfolio._id }),
        MockExperience.find({ portfolioId: portfolio._id }),
        MockTestimonial.find({ portfolioId: portfolio._id, isApproved: true }),
      ]);
    }

    return NextResponse.json({
      portfolio,
      user: user ? { name: user.name, avatar: user.avatar, email: user.email } : null,
      projects,
      skills,
      experiences,
      testimonials,
    });
  } catch (error) {
    console.error("Public portfolio error:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
