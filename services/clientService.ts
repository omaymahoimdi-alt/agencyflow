import Client from "@/models/Client";
import connectDB from "@/MongoDB/db";

export class ClientService {
  static async getAll() {
    await connectDB();
    return Client.find().sort({ createdAt: -1 });
  }

  static async create(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    status?: "active" | "inactive";
  }) {
    await connectDB();
    return Client.create(data);
  }
}
