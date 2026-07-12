import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockClient, MockProject, MockTask, MockTeam, MockClientDocument, MockDocument } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";
import path from "path";
import { loadData, saveData } from "@/lib/mock-db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    const { type, data } = body;
    if (!type || !data) {
      return NextResponse.json({ message: "Type et données requis" }, { status: 400 });
    }

    const base = { ...data };
    delete base._id;
    delete base.id;
    delete base.createdAt;
    delete base.updatedAt;
    delete base.dateCreation;
    for (const key of ["clientId", "projetId", "employeId", "userId"]) {
      if (base[key] && typeof base[key] === "object") {
        base[key] = base[key]._id || base[key].id;
      }
    }

    let entity: any;
    switch (type) {
      case "Client":
        entity = await MockClient.create({ ...base, workspaceId: session.user.workspaceId });
        await logActivity({ workspaceId: session.user.workspaceId, userId: session.user.id, userName: session.user.name || "", userEmail: session.user.email || "", entityType: "client", entityId: entity._id, entityName: entity.nomSociete, action: "restored" });
        break;
      case "Projet":
        entity = await MockProject.create({ ...base, workspaceId: session.user.workspaceId });
        await logActivity({ workspaceId: session.user.workspaceId, userId: session.user.id, userName: session.user.name || "", userEmail: session.user.email || "", entityType: "project", entityId: entity._id, entityName: entity.titre, action: "restored" });
        break;
      case "Tâche":
        entity = await MockTask.create({ ...base, workspaceId: session.user.workspaceId });
        await logActivity({ workspaceId: session.user.workspaceId, userId: session.user.id, userName: session.user.name || "", userEmail: session.user.email || "", entityType: "task", entityId: entity._id, entityName: entity.titre, action: "restored" });
        break;
      case "Membre":
        entity = await MockTeam.create({ ...base, workspaceId: session.user.workspaceId });
        break;
      case "Fichier": {
        const projectId = body.meta?.projectId;
        const folderId = body.meta?.folderId;
        const folderName = body.meta?.folderName;
        if (projectId && folderId && data) {
          // Restore project file (from project file manager)
          const foldersPath = path.join(process.cwd(), "data", `project_folders_${projectId}.json`);
          const folders = loadData<any[]>(foldersPath, []);
          const target = folders.find((f: any) => f.id === folderId);
          if (target) {
            target.files.push(data);
          } else {
            folders.push({ id: folderId, name: folderName || "Restauré", files: [data] });
          }
          await saveData(foldersPath, folders);
          entity = { success: true };
        } else if (data.documentName) {
          // Restore client document
          entity = await MockClientDocument.create({
            clientId: typeof data.clientId === "object" ? (data.clientId._id || data.clientId.id) : data.clientId,
            documentName: data.documentName,
            documentType: data.documentType,
            fileUrl: data.fileUrl,
            fileSize: data.fileSize,
            uploadedBy: session.user.id,
            uploadedByName: session.user.name || "",
            uploadedByEmail: session.user.email || "",
          });
        } else if (data.nomDocument) {
          // Restore generic document
          const docProjectId = typeof data.projectId === "object" ? (data.projectId._id || data.projectId.id) : data.projectId;
          const docUploadedBy = typeof data.uploadedBy === "object" ? (data.uploadedBy._id || data.uploadedBy.id) : data.uploadedBy;
          entity = await MockDocument.create({
            nomDocument: data.nomDocument,
            type: data.type,
            description: data.description || "",
            url: data.url || data.file || "",
            projectId: docProjectId || "",
            uploadedBy: docUploadedBy || session.user.id,
            workspaceId: session.user.workspaceId,
          });
        } else {
          return NextResponse.json({ message: "Type fichier non reconnu" }, { status: 400 });
        }
        break;
      }
      default:
        return NextResponse.json({ message: "Type inconnu" }, { status: 400 });
    }

    return NextResponse.json({ entity }, { status: 201 });
  } catch (error) {
    console.error("Error restoring item:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
