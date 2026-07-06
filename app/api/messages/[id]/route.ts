import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { hash } from "bcryptjs";
import Portfolio from "@/models/Portfolio";
import Message from "@/models/Message";
import User from "@/models/User";
import { MockUser, MockPortfolio, MockMessage } from "@/lib/mock-db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    let message;

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

      message = await Message.findOneAndUpdate(
        { _id: id, portfolioId: portfolio._id },
        { isRead: true },
        { new: true }
      );

      if (!message) {
        return NextResponse.json({ message: "Message non trouvé" }, { status: 404 });
      }
    } catch (dbError) {
      console.log("Using mock DB for messages PUT");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (messages PUT):", session.user.email);
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

      const mockMsg = await MockMessage.findById(id);
      if (!mockMsg || mockMsg.portfolioId !== portfolio._id) {
        return NextResponse.json({ message: "Message non trouvé" }, { status: 404 });
      }

      message = await MockMessage.findByIdAndUpdate(id, { isRead: true });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error updating message:", error);
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

      const message = await Message.findOneAndDelete({ _id: id, portfolioId: portfolio._id });
      if (!message) {
        return NextResponse.json({ message: "Message non trouvé" }, { status: 404 });
      }
    } catch (dbError) {
      console.log("Using mock DB for messages DELETE");
      let mockUser = await MockUser.findOne({ email: session.user.email });
      
      if (!mockUser) {
        console.log("Creating mock user for existing session (messages DELETE):", session.user.email);
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

      const mockMsg = await MockMessage.findById(id);
      if (!mockMsg || mockMsg.portfolioId !== portfolio._id) {
        return NextResponse.json({ message: "Message non trouvé" }, { status: 404 });
      }

      await MockMessage.findByIdAndDelete(id);
    }

    return NextResponse.json({ message: "Message supprimé" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
