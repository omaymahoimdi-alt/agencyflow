"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu, X, Star, ArrowRight, Bot, LayoutDashboard, CheckSquare,
  Building2, FileText, Sparkles, Clock, BarChart3, Users,
  MessageSquare, Calendar, Briefcase, TrendingUp, Target, Shield,
  Zap, Smartphone, Globe, ChevronRight, Play, Layers, Lock, Cloud,
  Trophy, GitBranch, AtSign, Link2, Mail, Heart, Eye, Lightbulb, MapPin,
  Phone, Quote,
} from "lucide-react";

const NAV_MAIN = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Solutions", href: "/solutions" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Ressources", href: "/ressources" },
  { label: "À propos", href: "/a-propos" },
];

const VALUES = [
  { icon: Lightbulb, title: "Innovation", desc: "Nous repoussons constamment les limites pour offrir les fonctionnalités les plus avancées à nos utilisateurs." },
  { icon: Users, title: "Collaboration", desc: "Nous croyons en la puissance du travail d'équipe et construisons des outils qui la favorisent." },
  { icon: Shield, title: "Sécurité", desc: "La protection de vos données est notre priorité absolue. Nous utilisons les meilleurs standards du marché." },
  { icon: TrendingUp, title: "Performance", desc: "Nous optimisons chaque partie de la plateforme pour une expérience rapide et fluide." },
];

const TEAM = [
  { name: "Alexandre Moreau", role: "CEO & Fondateur", initials: "AM", color: "from-violet-400 to-purple-500" },
  { name: "Sophie Laurent", role: "CTO & Co-fondatrice", initials: "SL", color: "from-emerald-400 to-teal-500" },
  { name: "Lucas Bernard", role: "CPO", initials: "LB", color: "from-amber-400 to-orange-500" },
  { name: "Emma Dubois", role: "Lead Designer", initials: "ED", color: "from-rose-400 to-pink-500" },
  { name: "Romain Petit", role: "Lead Developer", initials: "RP", color: "from-sky-400 to-blue-500" },
  { name: "Camille Roux", role: "Responsable Support", initials: "CR", color: "from-indigo-400 to-violet-500" },
];

const PARTNERS = ["Stripe", "AWS", "Vercel", "Supabase", "Cloudinary", "Resend"];

const CONTACT_INFO = [
  { icon: MapPin, label: "Adresse", value: "128 Avenue des Champs-Élysées, 75008 Paris" },
  { icon: Mail, label: "Email", value: "contact@agencyflow.app" },
  { icon: Phone, label: "Téléphone", value: "+33 1 23 45 67 89" },
];

function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

export default function APropos() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-20 border-b border-slate-100 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl shadow-sm" : "bg-white"}`}>
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 h-full">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-purple-600 shadow-lg shadow-[#6D28FF]/20">
              <Briefcase size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">AgencyFlow</span>
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            {NAV_MAIN.map((item) => (
              <Link key={item.label} href={item.href}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:text-[#6D28FF] hover:bg-[#6D28FF]/5">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">Se connecter</Link>
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-[#6D28FF] to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#6D28FF]/25 transition-all hover:opacity-90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">Créer mon portfolio</Link>
          </div>
          <button onClick={() => setNavOpen(!navOpen)} className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 lg:hidden">
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {navOpen && (
          <div className="border-t border-slate-100 bg-white px-6 pb-8 pt-6 lg:hidden">
            {NAV_MAIN.map((item) => (
              <Link key={item.label} href={item.href} className="block py-3 text-base font-medium text-slate-700" onClick={() => setNavOpen(false)}>{item.label}</Link>
            ))}
            <hr className="my-4 border-slate-100" />
            <Link href="/login" className="block py-3 text-base font-medium text-slate-700">Se connecter</Link>
            <Link href="/register" className="mt-3 block rounded-xl bg-gradient-to-r from-[#6D28FF] to-purple-600 px-5 py-3.5 text-center text-base font-medium text-white">Créer mon portfolio</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-20" style={{ minHeight: "500px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#6D28FF]/5 via-white to-white pointer-events-none" />
        <div className="absolute top-20 left-[20%] w-[400px] h-[400px] bg-[#6D28FF]/8 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-[1440px] px-6 text-center">
          <FadeInSection>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#6D28FF]/20 bg-[#6D28FF]/10 px-4 py-2 text-sm font-medium text-[#6D28FF]">
              <Heart size={16} /> Notre histoire
            </span>
            <h1 className="mt-8 text-4xl font-bold text-slate-900 lg:text-5xl xl:text-6xl">Notre mission :<br /><span className="text-[#6D28FF]">simplifier votre quotidien</span></h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">AgencyFlow est né d'une conviction : les freelances et les agences méritent une plateforme aussi professionnelle que les grands groupes.</p>
          </FadeInSection>
        </div>
      </section>

      {/* MISSION + HISTORY */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <FadeInSection>
              <div className="rounded-[22px] border border-slate-100 bg-white p-8 lg:p-10 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Notre mission</h2>
                <p className="text-slate-500 leading-relaxed mb-4">
                  AgencyFlow a été créé pour offrir aux freelances et aux agences une plateforme complète, élégante et puissante, sans avoir à jongler entre dix outils différents.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Nous croyons que la technologie doit être au service de la créativité et de la productivité, pas l'inverse.
                </p>
              </div>
            </FadeInSection>
            <FadeInSection delay={100}>
              <div className="rounded-[22px] border border-slate-100 bg-gradient-to-br from-[#6D28FF]/5 to-purple-500/5 p-8 lg:p-10 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Notre histoire</h2>
                <p className="text-slate-500 leading-relaxed mb-4">
                  Tout a commencé en 2024, quand notre fondateur, Alexandre, freelance en développement web, cherchait désespérément une solution pour centraliser sa gestion de projet, ses clients et son portfolio.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Face à des outils trop complexes ou trop limités, il a décidé de créer AgencyFlow. Aujourd'hui, la plateforme est utilisée par des milliers de professionnels à travers le monde.
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 bg-slate-50/50">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Nos valeurs</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Ce qui nous guide chaque jour dans la construction d'AgencyFlow.</p>
          </FadeInSection>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <FadeInSection key={v.title} delay={i * 80}>
                <div className="text-center p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6D28FF]/10 text-[#6D28FF] mx-auto mb-5 transition-all hover:scale-110 hover:bg-[#6D28FF]/20">
                    <v.icon size={30} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500">{v.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Notre équipe</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Des passionnés qui construisent l'avenir du travail indépendant.</p>
          </FadeInSection>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {TEAM.map((m, i) => (
              <FadeInSection key={m.name} delay={i * 80}>
                <div className="group rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 duration-300 text-center">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${m.color} text-xl font-bold text-white mx-auto mb-4 ring-4 ring-white shadow-lg`}>
                    {m.initials}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{m.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{m.role}</p>
                  <a href="#" className="inline-flex items-center gap-1 text-xs font-medium text-[#6D28FF] transition hover:gap-2">
                    <AtSign size={12} /> LinkedIn
                  </a>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-gradient-to-r from-[#6D28FF] to-purple-600">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "2500+", label: "Agences" },
              { value: "12000+", label: "Utilisateurs" },
              { value: "50000+", label: "Projets" },
              { value: "98%", label: "Clients satisfaits" },
            ].map((s) => (
              <FadeInSection key={s.label}>
                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm border border-white/10">
                  <p className="text-3xl font-bold text-white">{s.value}</p>
                  <p className="mt-2 text-sm text-violet-200">{s.label}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Nos partenaires</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Ils nous font confiance et nous accompagnent au quotidien.</p>
          </FadeInSection>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-40">
            {PARTNERS.map((p) => (
              <span key={p} className="text-xl font-bold text-slate-700 tracking-tight">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20 bg-slate-50/50">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Contactez-nous</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Une question ? Une idée ? Nous sommes là pour vous.</p>
          </FadeInSection>
          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {CONTACT_INFO.map((c, i) => (
              <FadeInSection key={c.label} delay={i * 80}>
                <div className="text-center p-6 rounded-[20px] border border-slate-100 bg-white shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6D28FF]/10 text-[#6D28FF] mx-auto mb-4">
                    <c.icon size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{c.label}</h3>
                  <p className="text-sm text-slate-500">{c.value}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
          <FadeInSection>
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-3">
                {[AtSign, Link2, GitBranch, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-[#6D28FF] hover:text-white hover:border-[#6D28FF] transition-all">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection>
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#6D28FF] to-purple-600 p-10 lg:p-16 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              <div className="relative max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white lg:text-4xl xl:text-5xl">Rejoignez l'aventure AgencyFlow</h2>
                <p className="mx-auto mt-5 max-w-xl text-lg text-violet-100">Créez votre compte gratuitement et faites partie de notre communauté de professionnels.</p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#6D28FF] shadow-xl transition-all hover:bg-violet-50 hover:scale-105 active:scale-95">
                    Créer mon compte <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-purple-600">
                  <Briefcase size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">AgencyFlow</span>
              </Link>
              <p className="text-sm text-slate-500 max-w-xs mb-6">La plateforme tout-en-un pour gérer votre activité freelance ou agence avec élégance et efficacité.</p>
              <div className="flex items-center gap-3">
                {[AtSign, Link2, GitBranch, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-[#6D28FF] hover:text-white hover:border-[#6D28FF] transition-all">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Roadmap", "API"] },
              { title: "Ressources", links: ["Documentation", "Blog", "Guides", "Support"] },
              { title: "Entreprise", links: ["À propos", "Carrières", "Contact", "Partenaires"] },
              { title: "Légal", links: ["Conditions d'utilisation", "Politique de confidentialité", "Cookies"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-slate-900 mb-5">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-400">© 2026 AgencyFlow - Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
