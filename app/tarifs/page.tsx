"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu, X, Star, ArrowRight, Bot, LayoutDashboard, CheckSquare,
  Building2, FileText, Sparkles, Clock, BarChart3, Users,
  MessageSquare, Calendar, Briefcase, TrendingUp, Target, Shield,
  Zap, Smartphone, Globe, ChevronRight, Play, Layers, Lock, Cloud,
  Trophy, GitBranch, AtSign, Link2, Mail, Check, HelpCircle, ChevronDown,
} from "lucide-react";

const NAV_MAIN = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Solutions", href: "/solutions" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Ressources", href: "/ressources" },
  { label: "À propos", href: "/a-propos" },
];

const PLANS = [
  {
    name: "Gratuit",
    price: "0 €",
    popular: false,
    desc: "Parfait pour découvrir AgencyFlow et démarrer votre activité.",
    features: ["3 projets", "5 utilisateurs", "Portfolio public", "Documents jusqu'à 50 Mo", "Statistiques de base", "Support par email"],
    cta: "Commencer gratuitement",
  },
  {
    name: "Pro",
    price: "19 €",
    popular: true,
    badge: "Le plus populaire",
    desc: "Pour les professionnels qui veulent aller plus loin avec l'IA et les rapports.",
    features: ["Projets illimités", "Utilisateurs illimités", "Assistant IA", "Rapports IA", "Suivi du temps illimité", "Productivité & Analytics", "Documents illimités", "Support prioritaire"],
    cta: "Essayer Pro",
  },
  {
    name: "Entreprise",
    price: "49 €",
    popular: false,
    desc: "Pour les organisations qui ont besoin de sécurité, API et personnalisation.",
    features: ["Tout du plan Pro", "API dédiée", "Support Premium 24/7", "Sécurité avancée", "Sauvegarde automatique", "Multi-agences", "Personnalisation", "SLA garanti"],
    cta: "Contacter les ventes",
  },
];

const COMPARISON_ROWS = [
  { label: "Projets", free: "3", pro: "Illimité", ent: "Illimité" },
  { label: "Utilisateurs", free: "5", pro: "Illimité", ent: "Illimité" },
  { label: "Portfolio public", free: true, pro: true, ent: true },
  { label: "Documents", free: "50 Mo", pro: "Illimité", ent: "Illimité" },
  { label: "Statistiques", free: "Basiques", pro: "Avancées", ent: "Avancées" },
  { label: "Assistant IA", free: false, pro: true, ent: true },
  { label: "Rapports IA", free: false, pro: true, ent: true },
  { label: "Suivi du temps", free: false, pro: "Illimité", ent: "Illimité" },
  { label: "Productivité", free: false, pro: true, ent: true },
  { label: "API dédiée", free: false, pro: false, ent: true },
  { label: "Support", free: "Email", pro: "Prioritaire", ent: "Premium 24/7" },
  { label: "Sécurité avancée", free: false, pro: false, ent: true },
  { label: "Multi-agences", free: false, pro: false, ent: true },
  { label: "SLA garanti", free: false, pro: false, ent: true },
];

const FAQS = [
  { q: "Puis-je passer du plan Gratuit au plan Pro à tout moment ?", r: "Oui, vous pouvez passer à un plan supérieur à tout moment. Vos données sont conservées et vous bénéficiez immédiatement des nouvelles fonctionnalités." },
  { q: "Y a-t-il un engagement de durée ?", r: "Aucun engagement. Vous pouvez résilier à tout moment depuis les paramètres de votre compte." },
  { q: "Que se passe-t-il si je dépasse la limite de mon forfait ?", r: "Nous vous informerons avant d'atteindre vos limites. Pour continuer à utiliser toutes les fonctionnalités, il vous suffit de passer au plan supérieur." },
  { q: "Les données sont-elles sécurisées ?", r: "Oui, toutes les données sont chiffrées en transit et au repos. Nous utilisons les meilleurs standards de sécurité pour protéger vos informations." },
  { q: "Puis-je inviter des membres de mon équipe ?", r: "Oui, les plans Pro et Entreprise permettent d'inviter un nombre illimité de membres avec des rôles et permissions personnalisables." },
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

export default function Tarifs() {
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
              <Zap size={16} /> Tarifs transparents
            </span>
            <h1 className="mt-8 text-4xl font-bold text-slate-900 lg:text-5xl xl:text-6xl">Un plan pour chaque<br /><span className="text-[#6D28FF]">besoin et budget</span></h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">Commencez gratuitement et passez à un plan supérieur quand vous êtes prêt. Sans engagement, sans surprise.</p>
          </FadeInSection>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="pb-16">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <FadeInSection key={plan.name} delay={i * 150}>
                <div className={`relative rounded-[22px] border p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1.5 duration-300 ${plan.popular ? "border-[#6D28FF]/30 bg-white shadow-[#6D28FF]/10 scale-105 ring-1 ring-[#6D28FF]/20" : "border-slate-100 bg-white"}`}>
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6D28FF] to-purple-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">{plan.badge}</span>
                  )}
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{plan.desc}</p>
                  <p className="mt-6 text-4xl font-bold text-slate-900">{plan.price}<span className="text-base font-medium text-slate-400">/mois</span></p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Check size={16} className="text-emerald-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`mt-8 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold transition active:scale-95 ${plan.popular ? "bg-gradient-to-r from-[#6D28FF] to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:opacity-90" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"}`}>
                    {plan.cta}
                  </Link>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-20 lg:py-28 bg-slate-50/50">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Comparer les forfaits</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">Trouvez le plan qui correspond le mieux à vos besoins.</p>
          </FadeInSection>
          <FadeInSection>
            <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Fonctionnalité</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">Gratuit</th>
                    <th className="px-6 py-4 text-center font-semibold text-[#6D28FF] bg-[#6D28FF]/5">Pro</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">Entreprise</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.label} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                      <td className="px-6 py-4 font-medium text-slate-700">{row.label}</td>
                      {["free", "pro", "ent"].map((tier) => {
                        const val = row[tier as keyof typeof row];
                        return (
                          <td key={tier} className={`px-6 py-4 text-center ${tier === "pro" ? "bg-[#6D28FF]/5" : ""}`}>
                            {val === true ? <Check size={16} className="text-emerald-500 mx-auto" /> :
                             val === false ? <span className="text-slate-300">—</span> :
                             <span className="text-slate-600">{val}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Questions fréquentes</h2>
            <p className="mx-auto mt-4 text-lg text-slate-500">Tout ce que vous devez savoir avant de choisir votre plan.</p>
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

      {/* CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <FadeInSection>
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#6D28FF] to-purple-600 p-10 lg:p-16 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1ucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGcgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij48cGF0aCBkPSJNMzYgMzR2MkgyNHYtMmgxMnpNMzYgMjR2MkgyNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
              <div className="relative max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white lg:text-4xl xl:text-5xl">Encore des doutes ?</h2>
                <p className="mx-auto mt-5 max-w-xl text-lg text-violet-100">Aucun engagement, aucune carte bancaire requise. Créez votre compte gratuitement.</p>
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
