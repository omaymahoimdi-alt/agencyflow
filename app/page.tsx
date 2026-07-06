"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu, X, Star, ArrowRight, Bot, Info, Compass,
  LayoutDashboard, CheckSquare, Building2, FileText, Sparkles,
  Clock, BarChart3, Users, MessageSquare, Calendar, Briefcase,
  TrendingUp, Target, Shield, Zap, Smartphone, Globe,
  ChevronRight, Play, Layers, Lock, Cloud, Trophy,
  GitBranch, AtSign, Link2, Mail
} from "lucide-react";
import GuidedTour from "@/components/GuidedTour";
import FeatureInfoModal from "@/components/FeatureInfoModal";

const NAV_MAIN = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Solutions", href: "/solutions" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Ressources", href: "/ressources" },
  { label: "À propos", href: "/a-propos" },
];

const MAIN_FEATURES = [
  { icon: Briefcase, title: "Gestion des projets", desc: "Organisez vos projets, tâches et deadlines.", img: "/images/gestiondeprojet.png" },
  { icon: Globe, title: "Portfolio public", desc: "Présentez vos réalisations.", img: "/images/portfolio.png" },
  { icon: MessageSquare, title: "Messages centralisés", desc: "Communiquez avec vos clients.", img: "/images/client.png" },
  { icon: BarChart3, title: "Statistiques avancées", desc: "Analysez toutes vos performances.", img: "/images/statistiques-rapports.png" },
];

const ALL_TOOLS = [
  { title: "Gestion des tâches", desc: "Créez, organisez, assignez et suivez toutes vos tâches facilement.", img: "/images/gestiondetaches.png" },
  { title: "Clients & CRM", desc: "Centralisez toutes les informations de vos clients.", img: "/images/client.png" },
  { title: "Fichiers & documents", desc: "Stockez tous vos documents dans un espace sécurisé.", img: "/images/fichiersdocuments.png" },
  { title: "Calendrier", desc: "Planifiez vos réunions et gérez vos échéances.", img: "/images/calendrier.png" },
  { title: "Suivi du temps", desc: "Analysez le temps consacré à chaque projet.", img: "/images/suividutemps.png" },
  { title: "Assistant IA", desc: "Posez vos questions et obtenez des réponses intelligentes.", img: "/images/assistantia.png" },
  { title: "Statistiques & Rapports", desc: "Analysez les performances grâce à des tableaux de bord interactifs.", img: "/images/statistiques-rapports.png" },
  { title: "Sécurité & Confidentialité", desc: "Vos données sont protégées par une sécurité avancée.", img: "/images/securite-confidentialite.png" },
  { title: "Productivité", desc: "Mesurez les performances de votre équipe en temps réel.", img: "/images/productivite.png" },
  { title: "Portfolio public", desc: "Partagez votre portfolio professionnel avec vos clients.", img: "/images/portfolio.png" },
  { title: "Gestion de projet", desc: "Suivez facilement la progression de tous vos projets.", img: "/images/gestiondeprojet.png" },
  { title: "Tableau de bord", desc: "Visualisez toutes vos statistiques et activités depuis une seule interface.", img: "/images/dashboardprincipal.png" },
];

const AVATARS = [
  { initial: "SM", color: "from-violet-400 to-purple-500" },
  { initial: "TD", color: "from-emerald-400 to-teal-500" },
  { initial: "LP", color: "from-amber-400 to-orange-500" },
  { initial: "AM", color: "from-rose-400 to-pink-500" },
  { initial: "CL", color: "from-sky-400 to-blue-500" },
  { initial: "NG", color: "from-indigo-400 to-violet-500" },
];

function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { 
        setTimeout(() => setVisible(true), delay);
        observer.disconnect(); 
      }
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

const FEATURE_INFO: Record<string, { details: string[] }> = {
  "Gestion des projets": {
    details: [
      "Créez et organisez vos projets avec une interface Kanban intuitive",
      "Assignez des tâches aux membres de votre équipe en un clic",
      "Suivez la progression en temps réel avec des diagrammes de Gantt",
      "Respectez vos deadlines grâce aux notifications automatiques",
    ],
  },
  "Portfolio public": {
    details: [
      "Créez un portfolio professionnel en quelques minutes sans coder",
      "Personnalisez les couleurs, thèmes et mise en page",
      "Partagez un lien public avec vos clients et prospects",
      "Importez vos projets GitHub automatiquement",
    ],
  },
  "Messages centralisés": {
    details: [
      "Centralisez tous les échanges avec vos clients au même endroit",
      "Répondez rapidement depuis votre tableau de bord",
      "Conservez l'historique complet de chaque conversation",
      "Ne perdez plus jamais un message important",
    ],
  },
  "Statistiques avancées": {
    details: [
      "Visualisez vos performances avec des graphiques interactifs",
      "Analysez le nombre de visites sur votre portfolio",
      "Suivez l'évolution de votre activité mois après mois",
      "Exportez vos rapports en PDF pour vos clients",
    ],
  },
  "Gestion des tâches": {
    details: [
      "Créez des listes de tâches avec priorités et échéances",
      "Assignez des tâches aux membres de votre équipe",
      "Utilisez le glisser-déposer pour réorganiser vos priorités",
      "Suivez le taux d'achèvement en temps réel",
    ],
  },
  "Clients & CRM": {
    details: [
      "Centralisez toutes les informations de vos clients",
      "Suivez l'historique des échanges et des projets",
      "Gérez vos prospects et opportunités commerciales",
      "Accédez aux données clients depuis n'importe où",
    ],
  },
  "Fichiers & documents": {
    details: [
      "Stockez tous vos documents dans un espace cloud sécurisé",
      "Partagez des fichiers volumineux sans limite",
      "Organisez vos documents par projet et par client",
      "Contrôlez les accès avec des permissions granulaires",
    ],
  },
  "Calendrier": {
    details: [
      "Planifiez vos réunions et rendez-vous visuellement",
      "Synchronisez avec Google Calendar et Outlook",
      "Définissez des rappels automatiques par email",
      "Visualisez les disponibilités de votre équipe",
    ],
  },
  "Suivi du temps": {
    details: [
      "Lancez un chronomètre depuis n'importe quelle tâche",
      "Analysez le temps passé sur chaque projet",
      "Exportez les rapports de temps pour la facturation",
      "Identifiez les tâches qui prennent le plus de temps",
    ],
  },
  "Assistant IA": {
    details: [
      "Posez des questions sur vos projets en langage naturel",
      "Générez automatiquement des comptes rendus de réunion",
      "Obtenez des suggestions pour optimiser votre organisation",
      "L'assistant apprend de vos habitudes de travail",
    ],
  },
};

const TOUR_STEPS = [
  {
    target: "nav",
    title: "Navigation principale",
    description: "Accédez rapidement à toutes les sections du site : Fonctionnalités, Solutions, Tarifs, Ressources et À propos.",
    placement: "bottom" as const,
  },
  {
    target: "section",
    title: "Hero Section",
    description: "Découvrez AgencyFlow en un coup d'œil. Créez votre portfolio freelance et gérez toute votre activité depuis un seul espace.",
    placement: "bottom" as const,
  },
  {
    target: "#features",
    title: "Fonctionnalités principales",
    description: "Gestion de projets, portfolio public, messagerie centralisée et statistiques. Les 4 piliers pour développer votre activité.",
    placement: "top" as const,
  },
  {
    target: "#solutions",
    title: "Tous les outils",
    description: "Explorez les 12 fonctionnalités complètes : tâches, CRM, documents, calendrier, suivi du temps, assistant IA et bien plus.",
    placement: "top" as const,
  },
  {
    target: "cta-section",
    title: "Prêt à commencer ?",
    description: "Rejoignez plus de 2 500 freelances et agences. Créez votre portfolio gratuitement en quelques clics.",
    placement: "top" as const,
  },
  {
    target: "footer",
    title: "Liens utiles",
    description: "Retrouvez toutes les informations légales, les ressources et les moyens de nous contacter en bas de page.",
    placement: "top" as const,
  },
];

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [modalFeature, setModalFeature] = useState<{ title: string; desc: string; icon: React.ElementType; details: string[] } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ===== NAVBAR ===== */}
      <nav id="nav" className={`fixed top-0 left-0 right-0 z-50 h-20 border-b border-slate-100 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : 'bg-white'}`}>
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

      {/* ===== HERO SECTION ===== */}
      <section id="hero" className="relative overflow-hidden pt-32 pb-24" style={{ minHeight: '760px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#6D28FF]/5 via-white to-white pointer-events-none" />
        <div className="absolute top-20 left-[15%] w-[500px] h-[500px] bg-[#6D28FF]/8 rounded-full blur-3xl" />
        <div className="absolute top-40 right-[10%] w-[400px] h-[400px] bg-purple-300/8 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-[1440px] px-6">
          <div className="grid gap-16 lg:grid-cols-[40%_60%] items-center">
            <FadeInSection>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#6D28FF]/20 bg-[#6D28FF]/10 px-4 py-2 text-sm font-medium text-[#6D28FF]">
                <Sparkles size={16} /> Tout-en-un pour freelances & agences
              </span>

              <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl xl:text-6xl xl:leading-[1.1]">
                Crée, publie et gère ton{" "}
                <span className="text-[#6D28FF]">portfolio freelance</span> depuis un seul espace.
              </h1>

              <p className="mt-6 text-lg text-slate-500 leading-relaxed">
                AgencyFlow centralise vos projets, vos tâches, vos clients, vos équipes, vos documents, le suivi du temps, vos statistiques, votre portfolio et votre assistant IA pour vous permettre de développer votre activité plus loin.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-[#6D28FF] px-7 py-4 text-base font-semibold text-white shadow-xl shadow-[#6D28FF]/25 transition-all hover:bg-[#5B21E5] hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98]">
                  Créer mon portfolio <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => setTourOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
                >
                  <Play size={18} /> Visite guidée
                </button>
              </div>

              <div className="mt-10 space-y-4">
                <p className="text-sm text-slate-500">
                  Plus de <span className="font-semibold text-slate-800">2 500 freelances et agences</span> utilisent AgencyFlow.
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex -space-x-3">
                    {AVATARS.slice(0, 6).map((a, i) => (
                      <div key={i} className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${a.color} text-xs font-bold text-white ring-2 ring-white shadow-sm`}>
                        {a.initial}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">4.9 / 5</p>
                      <p className="text-xs text-slate-500">820 avis</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={200}>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#6D28FF]/10 to-purple-500/10 rounded-[26px] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <img src="/images/dashboardprincipal.png" alt="Dashboard AgencyFlow" className="w-full rounded-[22px] shadow-2xl border border-slate-100 relative z-10 group-hover:scale-[1.01] transition-transform duration-500" />
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ===== MAIN FEATURES SECTION ===== */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MAIN_FEATURES.map(({ icon: Icon, title, desc, img }, index) => (
              <FadeInSection key={title} delay={index * 100}>
                <button
                  type="button"
                  onClick={() => {
                    const info = FEATURE_INFO[title];
                    if (info) setModalFeature({ title, desc, icon: Icon, details: info.details });
                  }}
                  className="w-full text-left group rounded-[20px] border border-slate-100 bg-white p-7 shadow-sm transition-all hover:shadow-xl hover:border-[#6D28FF]/20 hover:-translate-y-1.5 duration-300"
                >
                  <div className="relative h-28 mb-5 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
                    <img src={img} alt={title} className="h-20 w-20 object-contain transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <Info size={16} className="text-slate-300 group-hover:text-[#6D28FF] transition-colors shrink-0" />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1">{desc}</p>
                </button>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ALL TOOLS SECTION ===== */}
      <section id="solutions" className="bg-gradient-to-b from-white to-[#6D28FF]/5 py-20 lg:py-28">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="mx-auto max-w-3xl text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Toutes les fonctionnalités dont vous avez besoin pour réussir.</h2>
            <p className="mt-4 text-lg text-slate-500">AgencyFlow réunit tous les outils indispensables pour gérer efficacement votre activité professionnelle.</p>
          </FadeInSection>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {ALL_TOOLS.map(({ title, desc, img }, index) => (
              <FadeInSection key={title} delay={index * 50}>
                <button
                  type="button"
                  onClick={() => {
                    const info = FEATURE_INFO[title];
                    if (info) setModalFeature({ title, desc, icon: Sparkles, details: info.details });
                  }}
                  className="w-full text-left group rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-[#6D28FF]/20 hover:-translate-y-1 duration-300"
                >
                  <div className="relative h-32 mb-5 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
                    <img src={img} alt={title} className="h-24 w-24 object-contain transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-900">{title}</h4>
                    <Info size={15} className="text-slate-300 group-hover:text-[#6D28FF] transition-colors shrink-0" />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1">{desc}</p>
                </button>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section id="cta-section" className="py-24 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection>
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#6D28FF] to-purple-600 p-10 lg:p-16 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              <div className="relative max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white lg:text-4xl xl:text-5xl">Prêt à développer votre activité ?</h2>
                <p className="mx-auto mt-5 max-w-xl text-lg text-violet-100">
                  Rejoignez des milliers de freelances et d'agences qui utilisent déjà AgencyFlow.
                </p>
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

      {/* ===== FOOTER ===== */}
      <footer id="footer" className="border-t border-slate-100 bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-purple-600">
                  <Briefcase size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">AgencyFlow</span>
              </Link>
              <p className="text-sm text-slate-500 max-w-xs mb-6">
                La plateforme tout-en-un pour gérer votre activité freelance ou agence avec élégance et efficacité.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-[#6D28FF] hover:text-white hover:border-[#6D28FF] transition-all">
                  <AtSign size={18} />
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-[#6D28FF] hover:text-white hover:border-[#6D28FF] transition-all">
                  <Link2 size={18} />
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-[#6D28FF] hover:text-white hover:border-[#6D28FF] transition-all">
                  <GitBranch size={18} />
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-[#6D28FF] hover:text-white hover:border-[#6D28FF] transition-all">
                  <Mail size={18} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-5">Produit</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-5">Ressources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Guides</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-5">Entreprise</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">À propos</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Carrières</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-5">Légal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-[#6D28FF] transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-400">© 2026 AgencyFlow - Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Floating tour button */}
      <button
        type="button"
        onClick={() => setTourOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-gradient-to-r from-[#6D28FF] to-purple-600 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-[#6D28FF]/30 hover:shadow-[#6D28FF]/40 hover:scale-105 active:scale-95 transition-all animate-[fadeIn_0.6s_ease-out]"
      >
        <Compass size={18} />
        <span className="text-sm font-semibold">Visite guidée</span>
      </button>

      {/* Guided Tour */}
      <GuidedTour
        steps={TOUR_STEPS}
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />

      {/* Feature Info Modal */}
      {modalFeature && (
        <FeatureInfoModal
          isOpen={!!modalFeature}
          onClose={() => setModalFeature(null)}
          title={modalFeature.title}
          description={modalFeature.desc}
          details={modalFeature.details}
          icon={<modalFeature.icon size={22} />}
        />
      )}
    </div>
  );
}
