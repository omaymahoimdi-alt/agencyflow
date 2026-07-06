import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-6 py-16">
      {/* Background gradient - top left corner */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-[#6D28FF]/10 via-purple-500/10 to-pink-400/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-[520px] relative z-10 animate-[fadeIn_0.6s_ease-out]">
        <section className="w-full rounded-[20px] border border-[#E5E7EB] bg-white p-10 shadow-sm">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-purple-600 shadow-lg shadow-[#6D28FF]/20">
              <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 5C4 4.44772 4.44772 4 5 4H10.382C10.7607 4 11.107 4.214 11.2764 4.55279L13.051 8.10207C13.1453 8.29059 13.3263 8.41716 13.5366 8.43605L19.5366 8.98241C20.2153 9.04412 20.7324 9.61593 20.6707 10.2946C20.6457 10.5665 20.5482 10.8231 20.386 11.0378L14.386 18.7878C13.9303 19.3688 13.1085 19.6843 12.2534 19.5998L6.03497 18.978C5.29895 18.9044 4.72415 18.3296 4.65054 17.5936L4.0288 11.3751C3.96529 10.7468 4.18551 10.1385 4.61895 9.7138L10.072 4.32379" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] font-bold text-[#111827] mb-2">Inscription</h1>
            <p className="text-[#64748B]">Créez votre compte et votre espace portfolio professionnel.</p>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-[#64748B] mb-6">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-[#6D28FF] font-medium hover:underline">
              Se connecter
            </Link>
          </p>

          <RegisterForm />
        </section>

        {/* Footer links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#64748B] mb-4">Besoin d'aide ?</p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#94A3B8]">
            <Link href="#" className="hover:text-[#6D28FF] transition-colors">Support</Link>
            <Link href="#" className="hover:text-[#6D28FF] transition-colors">Contact</Link>
            <Link href="#" className="hover:text-[#6D28FF] transition-colors">Conditions d'utilisation</Link>
            <Link href="#" className="hover:text-[#6D28FF] transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </main>
  );
}
