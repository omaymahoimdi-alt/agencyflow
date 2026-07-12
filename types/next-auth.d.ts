import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
      workspaceId?: string;
      photo?: string;
      workspaceIds?: Array<{ workspaceId: string; role: string; nom: string }>;
    };
  }

  interface User {
    role?: string;
    workspaceId?: string;
    photo?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    workspaceId?: string;
    photo?: string;
    workspaceIds?: Array<{ workspaceId: string; role: string; nom: string }>;
  }
}
