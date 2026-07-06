"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu, X, Star, ArrowRight, Bot, LayoutDashboard, CheckSquare,
  Building2, FileText, Sparkles, Clock, BarChart3, Users,
  MessageSquare, Calendar, Briefcase, TrendingUp, Target, Shield,
  Zap, Smartphone, Globe, ChevronRight, Play, Layers, Lock, Cloud,
  Trophy, GitBranch, AtSign, Link2, Mail, Search, Code, Download, BookOpen,
  HelpCircle, Award, Camera, QrCode, UserCheck,
} from "lucide-react";

const NAV_MAIN = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Solutions", href: "/solutions" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Ressources", href: "/ressources" },
  { label: "À propos", href: "/a-propos" },
];

const ALL_FEATURES = [
  { icon: Briefcase, title: "Gestion des projets", desc: "Organisez, planifiez et suivez l'avancement de tous vos projets en un coup d'œil avec un tableau de bord intuitif.", img: "/images/gestiondeprojet.png" },
  { icon: CheckSquare, title: "Gestion des tâches", desc: "Créez, assignez et priorisez vos tâches. Suivez leur progression avec des filtres puissants.", img: "/images/gestiondetaches.png" },
  { icon: Building2, title: "Gestion des clients", desc: "Centralisez les informations, documents et échanges avec chaque client dans un espace dédié.", img: "/images/client.png" },
  { icon: Users, title: "Gestion des équipes", desc: "Collaborez en temps réel avec votre équipe, assignez des rôles et suivez la charge de travail.", img: "/images/team.png" },
  { icon: Bot, title: "Assistant IA", desc: "Un IA intelligente qui analyse vos données et répond à toutes vos questions en langage naturel.", img: "/images/assistantia.png" },
  { icon: Clock, title: "Suivi du temps", desc: "Mesurez le temps passé sur chaque tâche et projet pour optimiser votre facturation.", img: "/images/suividutemps.png" },
  { icon: TrendingUp, title: "Productivité", desc: "Visualisez les performances individuelles et collectives avec des métriques claires.", img: "/images/productivite.png" },
  { icon: BarChart3, title: "Rapports intelligents", desc: "Des rapports détaillés générés automatiquement pour analyser tous vos indicateurs.", img: "/images/statistiques-rapports.png" },
  { icon: FileText, title: "Documents", desc: "Stockez, organisez et partagez tous vos documents dans un cloud sécurisé.", img: "/images/fichiersdocuments.png" },
  { icon: Calendar, title: "Calendrier", desc: "Planifiez vos réunions, échéances et événements avec une vue calendrier complète.", img: "/images/calendrier.png" },
  { icon: Globe, title: "Portfolio public", desc: "Créez et partagez un portfolio professionnel avec un lien unique pour attirer des clients.", img: "/images/portfolio.png" },
  { icon: Shield, title: "Sécurité", desc: "Vos données sont protégées par un chiffrement avancé et une authentification sécurisée.", img: "/images/securite-confidentialite.png" },
];

const ADVANCED_FEATURES = [
  { icon: Bot, title: "IA & Automatisation", desc: "Déléguez les tâches répétitives à l'IA et concentrez-vous sur l'essentiel." },
  { icon: BarChart3, title: "Rapports IA", desc: "Des analyses prédictives et des recommandations basées sur vos données." },
  { icon: MessageSquare, title: "Chatbot intelligent", desc: "Un chatbot formé sur vos données pour répondre instantanément à vos questions." },
  { icon: QrCode, title: "QR Code", desc: "Générez des QR codes pour partager votre portfolio et vos projets." },
  { icon: Shield, title: "reCAPTCHA", desc: "Protection anti-spam intégrée pour vos formulaires publics." },
  { icon: Clock, title: "Time Tracking", desc: "Chronométrez précisément le temps passé sur chaque activité." },
  { icon: Award, title: "Hall of Fame", desc: "Célébrez les meilleures performances de votre équipe." },
  { icon: UserCheck, title: "Employé du mois", desc: "Mettez en avant les membres les plus performants." },
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

export default function Fonctionnalites() {
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
              <Sparkles size={16} /> Toutes les fonctionnalités
            </span>
            <h1 className="mt-8 text-4xl font-bold text-slate-900 lg:text-5xl xl:text-6xl">Tout ce dont vous avez besoin,<br />réuni au même endroit.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">Découvrez une suite complète d'outils conçus pour les freelances, agences et équipes qui veulent gérer leur activité professionnellement.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-[#6D28FF] px-7 py-4 text-base font-semibold text-white shadow-xl shadow-[#6D28FF]/25 transition-all hover:bg-[#5B21E5] hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98]">
                Commencer gratuitement <ArrowRight size={18} />
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#6D28FF]/10 to-purple-500/10 rounded-[26px] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <img src="/images/dashboardprincipal.png" alt="Dashboard AgencyFlow" className="w-full rounded-[22px] shadow-2xl border border-slate-100 relative z-10" />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ALL FEATURES GRID */}
      <section className="py-20 lg:py-28 bg-slate-50/50">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Explorez toutes nos fonctionnalités</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Chaque outil a été pensé pour vous faire gagner du temps et simplifier votre gestion quotidienne.</p>
          </FadeInSection>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ALL_FEATURES.map((f, i) => (
              <FadeInSection key={f.title} delay={i * 50}>
                <div className="group rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-[#6D28FF]/20 hover:-translate-y-1.5 duration-300">
                  <div className="relative h-32 mb-5 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
                    <img src={f.img} alt={f.title} className="h-20 w-20 object-contain transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D28FF]/10 text-[#6D28FF]">
                      <f.icon size={16} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{f.desc}</p>
                  <Link href="/register" className="inline-flex items-center gap-1 text-sm font-semibold text-[#6D28FF] transition hover:gap-2">
                    Découvrir <ChevronRight size={14} />
                  </Link>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ADVANCED FEATURES */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#6D28FF]/20 bg-[#6D28FF]/10 px-4 py-2 text-sm font-medium text-[#6D28FF] mb-4">
              <Zap size={16} /> Fonctionnalités avancées
            </span>
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Des outils puissants pour aller plus loin</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Des fonctionnalités exclusives pour les utilisateurs qui veulent repousser leurs limites.</p>
          </FadeInSection>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ADVANCED_FEATURES.map((f, i) => (
              <FadeInSection key={f.title} delay={i * 50}>
                <div className="group rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-[#6D28FF]/20 hover:-translate-y-1 duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6D28FF]/10 text-[#6D28FF] mb-4 transition-all group-hover:scale-110 group-hover:bg-[#6D28FF]/20">
                    <f.icon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection>
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#6D28FF] to-purple-600 p-10 lg:p-16 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              <div className="relative max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white lg:text-4xl xl:text-5xl">Prêt à découvrir toutes ces fonctionnalités ?</h2>
                <p className="mx-auto mt-5 max-w-xl text-lg text-violet-100">Créez votre compte gratuitement et explorez tout ce qu'AgencyFlow peut faire pour vous.</p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#6D28FF] shadow-xl transition-all hover:bg-violet-50 hover:scale-105 active:scale-95">
                    Créer mon portfolio <ArrowRight size={18} />
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
