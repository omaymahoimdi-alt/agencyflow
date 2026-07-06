import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockClient, MockProject, MockTask, MockTeam, MockDocument } from "@/lib/mock-db";

export async function GET() {
  // Return empty stats so dashboard doesn't crash even without session
  const emptyStats = {
    totalClients: 0, totalProjects: 0, totalTasks: 0,
    totalEmployes: 0, totalDocuments: 0, totalBudget: 0,
    projectsByStatut: [], tasksByStatut: [],
    projectsPerClient: [], recentProjects: [],
  };

  try {
    const session = await getServerSession(authOptions);
    console.log("Session in /api/stats:", session);
    if (!session?.user?.id) {
      console.log("No session user id, returning empty stats");
      return NextResponse.json(emptyStats);
    }

    // FORCE USING MOCK DB
    console.log("Using mock DB for stats");
    
    const userId = session.user.id;
    const [
      clients,
      projects,
      tasks,
      teamMembers,
      docs,
    ] = await Promise.all([
      MockClient.find(userId),
      MockProject.find(userId),
      MockTask.find({ userId }),
      MockTeam.find(),
      MockDocument.find(userId),
    ]);
    
    console.log("Clients found:", clients.length);
    console.log("Projects found:", projects.length);

    // Calculate projects by status
    const projectsByStatutObj: Record<string, number> = {};
    projects.forEach(p => {
      if (p.statut) {
        projectsByStatutObj[p.statut] = (projectsByStatutObj[p.statut] || 0) + 1;
      }
    });
    const projectsByStatut = Object.entries(projectsByStatutObj).map(([key, count]) => ({ _id: key, count }));

    // Calculate tasks by status
    const tasksByStatutObj: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.statut) {
        tasksByStatutObj[t.statut] = (tasksByStatutObj[t.statut] || 0) + 1;
      }
    });
    const tasksByStatut = Object.entries(tasksByStatutObj).map(([key, count]) => ({ _id: key, count }));

    // Calculate projects per client
    const projectsPerClientObj: Record<string, number> = {};
    projects.forEach(p => {
      if (p.clientId) {
        const clientId = typeof p.clientId === "string" ? p.clientId : p.clientId._id;
        projectsPerClientObj[clientId] = (projectsPerClientObj[clientId] || 0) + 1;
      }
    });
    
    // Convert to array and add client names
    const projectsPerClient = Object.entries(projectsPerClientObj)
      .map(([clientId, count]) => {
        const client = clients.find(c => c._id === clientId);
        return { nomSociete: client?.nomSociete || "Client inconnu", count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent projects
    const recentProjects = projects
      .slice(0, 5)
      .map(p => ({
        _id: p._id,
        titre: p.titre,
        statut: p.statut,
        priorite: p.priorite,
        clientId: typeof p.clientId === "string" ? null : p.clientId,
      }));

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    return NextResponse.json({
      totalClients: clients.length,
      totalProjects: projects.length,
      totalTasks: tasks.length,
      totalEmployes: teamMembers.length,
      totalDocuments: docs.length,
      totalBudget,
      projectsByStatut,
      tasksByStatut,
      projectsPerClient,
      recentProjects,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(emptyStats);
  }
}