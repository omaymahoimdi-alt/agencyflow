import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">Connexion</h1>
        <p className="mt-2 text-sm text-slate-500">Accede a ton dashboard prive.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
