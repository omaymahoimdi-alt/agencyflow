"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu, X, Star, ArrowRight, Bot, LayoutDashboard, CheckSquare,
  Building2, FileText, Sparkles, Clock, BarChart3, Users,
  MessageSquare, Calendar, Briefcase, TrendingUp, Target, Shield,
  Zap, Smartphone, Globe, ChevronRight, Play, Layers, Lock, Cloud,
  Trophy, GitBranch, AtSign, Link2, Mail, BookOpen, HelpCircle, Download,
  Code, Map, Newspaper, Headphones, ChevronDown,
} from "lucide-react";

const NAV_MAIN = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Solutions", href: "/solutions" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Ressources", href: "/ressources" },
  { label: "À propos", href: "/a-propos" },
];

const RESOURCE_CATEGORIES = [
  {
    title: "Documentation",
    icon: BookOpen,
    desc: "Guides complets et documentation technique pour maîtriser AgencyFlow.",
    color: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-200/50",
    items: ["Guide de démarrage", "Configuration du profil", "Gestion des projets", "Gestion des tâches", "Utilisation de l'IA", "API Reference"],
  },
  {
    title: "Tutoriels",
    icon: Play,
    desc: "Apprenez pas à pas avec nos tutoriels vidéo et guides interactifs.",
    color: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-200/50",
    items: ["Premiers pas avec AgencyFlow", "Créer son portfolio", "Gérer son équipe", "Analyser ses statistiques", "Utiliser le Time Tracking", "Exporter ses rapports"],
  },
  {
    title: "FAQ & Aide",
    icon: HelpCircle,
    desc: "Les réponses aux questions les plus fréquentes sur AgencyFlow.",
    color: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-200/50",
    items: ["Compte et inscription", "Projets et tâches", "Facturation et paiement", "Sécurité des données", "Invitations et équipe", "Dépannage"],
  },
  {
    title: "Blog & Actualités",
    icon: Newspaper,
    desc: "Suivez l'actualité d'AgencyFlow et découvrez nos conseils.",
    color: "from-rose-500/10 to-pink-500/10",
    border: "border-rose-200/50",
    items: ["Nouveautés de la plateforme", "Conseils productivité", "Témoignages clients", "Études de cas", "Webinaires", "Communauté"],
  },
];

const DOWNLOADS = [
  { name: "Application Windows", desc: "Version desktop complète pour Windows 10/11", icon: Download },
  { name: "Application Mac", desc: "Version optimisée pour macOS (Intel & Silicon)", icon: Download },
  { name: "Application Android", desc: "Application mobile pour Android 12+", icon: Smartphone },
  { name: "Application iOS", desc: "Application mobile pour iPhone et iPad", icon: Smartphone },
];

const FAQS = [
  { q: "Comment créer mon compte ?", r: "Rendez-vous sur la page d'inscription, remplissez vos informations et confirmez votre email. C'est gratuit et sans engagement." },
  { q: "Comment inviter des membres dans mon équipe ?", r: "Depuis le tableau de bord, allez dans l'onglet Équipe > Inviter. Saisissez l'email du membre et choisissez son rôle." },
  { q: "Comment exporter mes données ?", r: "Dans Paramètres > Export, vous pouvez exporter toutes vos données en CSV, PDF ou via l'API." },
  { q: "L'API est-elle accessible ?", r: "Oui, l'API est accessible sur les plans Entreprise. Consultez la documentation développeur pour plus d'informations." },
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

export default function Ressources() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

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
              <BookOpen size={16} /> Centre de ressources
            </span>
            <h1 className="mt-8 text-4xl font-bold text-slate-900 lg:text-5xl xl:text-6xl">Tout pour <span className="text-[#6D28FF]">maîtriser</span> AgencyFlow</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">Documentation, tutoriels, FAQ, blog, téléchargements et API — tout ce dont vous avez besoin pour tirer le meilleur de la plateforme.</p>
          </FadeInSection>
        </div>
      </section>

      {/* RESOURCE CATEGORIES */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {RESOURCE_CATEGORIES.map((cat, i) => (
              <FadeInSection key={cat.title} delay={i * 100}>
                <div className={`rounded-[22px] border ${cat.border} bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color}`}>
                      <cat.icon size={24} className="text-[#6D28FF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{cat.title}</h3>
                      <p className="text-sm text-slate-500">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {cat.items.map((item) => (
                      <a key={item} href="#" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-[#6D28FF]/5 hover:text-[#6D28FF]">
                        <ChevronRight size={12} className="text-slate-400" />
                        {item}
                      </a>
                    ))}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOADS */}
      <section className="py-20 bg-slate-50/50">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Téléchargements</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Accédez à AgencyFlow depuis tous vos appareils.</p>
          </FadeInSection>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            {DOWNLOADS.map((d, i) => (
              <FadeInSection key={d.name} delay={i * 80}>
                <a href="#" className="group flex flex-col items-center rounded-[20px] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-[#6D28FF]/20 hover:-translate-y-1 duration-300">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6D28FF]/10 text-[#6D28FF] mb-4 transition-all group-hover:scale-110 group-hover:bg-[#6D28FF]/20">
                    <d.icon size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{d.name}</h3>
                  <p className="text-xs text-slate-500 text-center">{d.desc}</p>
                </a>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* API & ROADMAP */}
      <section className="py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <FadeInSection>
              <div className="rounded-[22px] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                    <Code size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">API développeur</h3>
                    <p className="text-sm text-slate-500">Intégrez AgencyFlow à vos propres applications.</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-5">Notre API RESTful vous permet de créer, lire, mettre à jour et supprimer toutes vos données programmatiquement.</p>
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">REST API</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Webhooks</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">OAuth 2.0</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Rate Limiting</span>
                </div>
                <Link href="/register" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#6D28FF] transition hover:gap-2">
                  Voir la documentation <ChevronRight size={14} />
                </Link>
              </div>
            </FadeInSection>
            <FadeInSection delay={100}>
              <div className="rounded-[22px] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                    <Map size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Roadmap</h3>
                    <p className="text-sm text-slate-500">Découvrez les fonctionnalités à venir.</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-5">Nous améliorons constamment AgencyFlow. Voici ce qui arrive bientôt.</p>
                <div className="space-y-4">
                  {[
                    { title: "Mode hors-ligne", status: "En développement", color: "bg-amber-500" },
                    { title: "Intégration calendrier externe", status: "En développement", color: "bg-amber-500" },
                    { title: "Facturation intégrée", status: "Planifié", color: "bg-blue-500" },
                    { title: "Application mobile native", status: "Planifié", color: "bg-blue-500" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{item.title}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#6D28FF] transition hover:gap-2">
                  Voir la roadmap complète <ChevronRight size={14} />
                </Link>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Questions fréquentes</h2>
            <p className="mx-auto mt-4 text-lg text-slate-500">Les réponses aux questions les plus posées.</p>
          </FadeInSection>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FadeInSection key={i}>
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between px-6 py-5 text-left">
                    <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${faqOpen === i ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${faqOpen === i ? "max-h-40" : "max-h-0"}`}>
                    <div className="border-t border-slate-100 px-6 pb-5 pt-4">
                      <p className="text-sm text-slate-500 leading-relaxed">{faq.r}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
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
