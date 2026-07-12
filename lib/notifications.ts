import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { MockNotification } from "@/lib/mock-db";

export interface CreateNotificationParams {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  entityType?: string;
  entityId?: string;
  fromUserId?: string;
  fromUserName?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectDB();
    await Notification.create(params);
  } catch {
    await MockNotification.create(params);
  }
}

export async function notifyWorkspaceMembers(
  workspaceId: string,
  excludeUserId: string,
  type: string,
  title: string,
  message?: string,
  link?: string,
  entityType?: string,
  entityId?: string,
  fromUserName?: string,
) {
  try {
    await connectDB();
    const WorkspaceMember = (await import("@/models/WorkspaceMember")).default;
    const members = await WorkspaceMember.find({ workspaceId, status: "Actif" });
    const notifications = members
      .filter((m: any) => m.userId.toString() !== excludeUserId)
      .map((m: any) => ({
        workspaceId,
        userId: m.userId,
        type,
        title,
        message: message || title,
        link: link || "",
        entityType: entityType || "",
        entityId: entityId || "",
        fromUserName: fromUserName || "",
      }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch {
    const { MockWorkspaceMember, MockNotification } = await import("@/lib/mock-db");
    const allMembers = await MockWorkspaceMember.find({ workspaceId });
    const members = allMembers.filter((m: any) => m.status === "Actif");
    const notifications = members
      .filter((m: any) => m.userId !== excludeUserId)
      .map((m: any) => ({
        workspaceId,
        userId: m.userId,
        type,
        title,
        message: message || title,
        link: link || "",
        entityType: entityType || "",
        entityId: entityId || "",
        fromUserName: fromUserName || "",
      }));
    for (const n of notifications) {
      await MockNotification.create(n);
    }
  }
}
