import { NextResponse } from "next/server";
import { ClientService } from "@/services/clientService";

export class ClientController {
  static async getClients() {
    try {
      const clients = await ClientService.getAll();
      return NextResponse.json(clients);
    } catch {
      return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
  }

  static async createClient(req: Request) {
    try {
      const body = await req.json();

      if (!body.name || !body.email) {
        return NextResponse.json(
          { message: "Le nom et l'email sont obligatoires." },
          { status: 400 }
        );
      }

      const client = await ClientService.create({
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        status: body.status,
      });

      return NextResponse.json(client, { status: 201 });
    } catch {
      return NextResponse.json({ message: "Création impossible" }, { status: 400 });
    }
  }
}
