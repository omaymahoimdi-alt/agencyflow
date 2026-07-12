import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";
import { MockActivity } from "@/lib/mock-db";

export interface LogActivityParams {
  workspaceId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  action: string;
  description?: string;
}

export async function logActivity(params: LogActivityParams) {
  const { workspaceId, userId, userName, userEmail, entityType, entityId, entityName, action, description } = params;
  const desc = description || `${action} ${entityType} "${entityName || entityId}"`;

  try {
    await connectDB();
    await Activity.create({
      workspaceId, userId, userName: userName || "", userEmail: userEmail || "",
      entityType, entityId: entityId || "", entityName: entityName || "",
      action, description: desc,
    });
  } catch {
    await MockActivity.create({
      workspaceId, userId, userName: userName || "", userEmail: userEmail || "",
      entityType, entityId: entityId || "", entityName: entityName || "",
      action, description: desc,
    });
  }
}
