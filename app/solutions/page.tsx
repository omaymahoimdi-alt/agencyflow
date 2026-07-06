"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu, X, Star, ArrowRight, Bot, LayoutDashboard, CheckSquare,
  Building2, FileText, Sparkles, Clock, BarChart3, Users,
  MessageSquare, Calendar, Briefcase, TrendingUp, Target, Shield,
  Zap, Smartphone, Globe, ChevronRight, Play, Layers, Lock, Cloud,
  Trophy, GitBranch, AtSign, Link2, Mail, Code, PenTool, UserCheck,
} from "lucide-react";

const NAV_MAIN = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Solutions", href: "/solutions" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Ressources", href: "/ressources" },
  { label: "À propos", href: "/a-propos" },
];

const SOLUTIONS_DATA = [
  {
    role: "Freelances",
    icon: Briefcase,
    desc: "Tout ce dont vous avez besoin pour gérer votre activité en solo : clients, projets, facturation et portfolio.",
    features: ["Gestion des clients", "Portfolio professionnel", "Suivi du temps", "Statistiques"],
    gradient: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-200/50",
    img: "/images/gestiondeprojet.png",
  },
  {
    role: "Agences",
    icon: Building2,
    desc: "Collaborez avec votre équipe, gérez plusieurs clients et projets simultanément avec des outils puissants.",
    features: ["Gestion des équipes", "Multi-projets", "Rapports d'équipe", "Calendrier partagé"],
    gradient: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-200/50",
    img: "/images/productivite.png",
  },
  {
    role: "Chefs de projet",
    icon: LayoutDashboard,
    desc: "Pilotez vos projets avec des vues Kanban, Gantt et calendrier. Suivez chaque étape en temps réel.",
    features: ["Vue Kanban", "Diagramme Gantt", "Calendrier", "Statistiques avancées"],
    gradient: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-200/50",
    img: "/images/gestiondeprojet.png",
  },
  {
    role: "Développeurs",
    icon: Code,
    desc: "Suivez vos bugs, documentez votre code et gérez votre temps avec des outils adaptés aux développeurs.",
    features: ["Suivi des bugs", "Documentation", "Git intégré", "Time Tracking"],
    gradient: "from-blue-500/10 to-indigo-500/10",
    border: "border-blue-200/50",
    img: "/images/gestiondetaches.png",
  },
  {
    role: "Designers",
    icon: PenTool,
    desc: "Présentez vos maquettes, recueillez des commentaires et montrez votre portfolio professionnel.",
    features: ["Maquettes & Protos", "Commentaires clients", "Validation", "Portfolio créatif"],
    gradient: "from-pink-500/10 to-rose-500/10",
    border: "border-pink-200/50",
    img: "/images/portfolio.png",
  },
  {
    role: "Entreprises",
    icon: Shield,
    desc: "Une solution robuste avec sécurité avancée, permissions et rapports pour les équipes de grande taille.",
    features: ["Multi-équipes", "Sécurité avancée", "Permissions", "Rapports dédiés"],
    gradient: "from-sky-500/10 to-cyan-500/10",
    border: "border-sky-200/50",
    img: "/images/securite-confidentialite.png",
  },
];

const STATS = [
  { value: "2500+", label: "Agences & Freelances" },
  { value: "98%", label: "Clients satisfaits" },
  { value: "50K+", label: "Projets gérés" },
  { value: "4.9/5", label: "Avis utilisateurs" },
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

export default function Solutions() {
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
              <Users size={16} /> Solutions adaptées
            </span>
            <h1 className="mt-8 text-4xl font-bold text-slate-900 lg:text-5xl xl:text-6xl">Une solution pour chaque<br /><span className="text-[#6D28FF]">métier et chaque besoin</span></h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">Que vous soyez freelance, agence ou entreprise, AgencyFlow s'adapte à votre façon de travailler.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-[#6D28FF] px-7 py-4 text-base font-semibold text-white shadow-xl shadow-[#6D28FF]/25 transition-all hover:bg-[#5B21E5] hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98]">
                Trouver ma solution <ArrowRight size={18} />
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* SOLUTIONS GRID */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {SOLUTIONS_DATA.map((s, i) => (
              <FadeInSection key={s.role} delay={i * 100}>
                <div className={`group rounded-[22px] border ${s.border} bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1.5 duration-300`}>
                  <div className={`h-40 mb-6 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center overflow-hidden`}>
                    <img src={s.img} alt={s.role} className="h-24 w-24 object-contain transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D28FF]/10 text-[#6D28FF]">
                      <s.icon size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{s.role}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-5">{s.desc}</p>
                  <ul className="space-y-2.5 mb-6">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#6D28FF]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="inline-flex items-center gap-1 text-sm font-semibold text-[#6D28FF] transition hover:gap-2">
                    Découvrir <ChevronRight size={14} />
                  </Link>
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
            {STATS.map((s) => (
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

      {/* COMPARISON */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Pourquoi choisir AgencyFlow ?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Des milliers de professionnels nous font déjà confiance. Voici pourquoi.</p>
          </FadeInSection>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Tout-en-un", desc: "Plus besoin de jongler entre 10 outils différents. Tout est centralisé." },
              { icon: Bot, title: "IA intégrée", desc: "Un assistant intelligent qui analyse vos données et vous aide au quotidien." },
              { icon: Shield, title: "Sécurisé", desc: "Vos données sont chiffrées et protégées avec les meilleurs standards." },
              { icon: Smartphone, title: "Accessible partout", desc: "Sur desktop, tablette et mobile. Votre activité vous suit partout." },
            ].map((item, i) => (
              <FadeInSection key={item.title} delay={i * 50}>
                <div className="text-center p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6D28FF]/10 text-[#6D28FF] mx-auto mb-4">
                    <item.icon size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection>
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#6D28FF] to-purple-600 p-10 lg:p-16 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              <div className="relative max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white lg:text-4xl xl:text-5xl">Prêt à trouver la solution qu'il vous faut ?</h2>
                <p className="mx-auto mt-5 max-w-xl text-lg text-violet-100">Créez votre compte gratuit et découvrez comment AgencyFlow peut transformer votre activité.</p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#6D28FF] shadow-xl transition-all hover:bg-violet-50 hover:scale-105 active:scale-95">
                    Commencer gratuitement <ArrowRight size={18} />
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
