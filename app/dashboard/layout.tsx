import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="min-h-screen lg:ml-72">
        <Navbar userName={session.user.name || session.user.email || "Admin"} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
