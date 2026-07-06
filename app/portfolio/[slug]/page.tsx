import { notFound } from "next/navigation";
import ContactForm from "./ContactForm";
import "./portfolio.css";

interface PortfolioData {
  portfolio: {
    _id: string;
    title: string;
    bio: string;
    primaryColor: string;
    slug: string;
    views: number;
  };
  user: { name: string; avatar: string; email: string } | null;
  projects: {
    _id: string;
    title: string;
    description: string;
    images: string[];
    tags: string[];
    liveUrl: string;
    githubUrl: string;
  }[];
  skills: { _id: string; name: string; category: string; level: number; icon: string }[];
  experiences: {
    _id: string;
    type: "work" | "education";
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }[];
  testimonials: {
    _id: string;
    authorName: string;
    authorJob: string;
    authorAvatar: string;
    content: string;
    rating: number;
  }[];
}

async function getPortfolioData(slug: string): Promise<PortfolioData | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/public/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function groupSkillsByCategory(skills: PortfolioData["skills"]) {
  return skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    const cat = skill.category || "Autres";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPortfolioData(slug);

  if (!data) return notFound();

  const { portfolio, user, projects, skills, experiences, testimonials } = data;
  const color = portfolio.primaryColor || "#6366f1";
  const skillGroups = groupSkillsByCategory(skills);
  const workExp = experiences.filter((e) => e.type === "work");
  const eduExp = experiences.filter((e) => e.type === "education");

  return (
    <div className="pf-root" style={{ "--pf-color": color } as React.CSSProperties}>
      {/* NAV */}
      <nav className="pf-nav">
        <span className="pf-nav-brand" style={{ color }}>
          {portfolio.title}
        </span>
        <div className="pf-nav-links">
          {projects.length > 0 && <a href="#projects">Projets</a>}
          {skills.length > 0 && <a href="#skills">Compétences</a>}
          {experiences.length > 0 && <a href="#experience">Expérience</a>}
          {testimonials.length > 0 && <a href="#testimonials">Avis</a>}
          <a href="#contact" className="pf-nav-cta" style={{ background: color }}>
            Contact
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="pf-hero">
        <div className="pf-hero-glow" style={{ background: `${color}22` }} />
        <div className="pf-hero-inner">
          <div className="pf-hero-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                {(user?.name || portfolio.title).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="pf-available-badge">
            <span className="pf-dot" style={{ background: "#22c55e" }} />
            Disponible pour des missions
          </div>
          <h1 className="pf-hero-name">{user?.name || portfolio.title}</h1>
          <p className="pf-hero-title" style={{ color }}>{portfolio.title}</p>
          {portfolio.bio && <p className="pf-hero-bio">{portfolio.bio}</p>}
          <div className="pf-hero-actions">
            <a href="#projects" className="pf-btn-primary" style={{ background: color }}>
              Voir mes projets
            </a>
            <a href="#contact" className="pf-btn-ghost">
              Me contacter
            </a>
          </div>
        </div>
        <div className="pf-hero-scroll">
          <div className="pf-scroll-indicator" />
        </div>
      </section>

      {/* PROJECTS */}
      {projects.length > 0 && (
        <section id="projects" className="pf-section">
          <div className="pf-container">
            <div className="pf-section-header">
              <span className="pf-badge" style={{ color, borderColor: color }}>Portfolio</span>
              <h2 className="pf-section-title">Mes Projets</h2>
              <p className="pf-section-sub">{projects.length} projet{projects.length > 1 ? "s" : ""} réalisé{projects.length > 1 ? "s" : ""}</p>
            </div>
            <div className="pf-projects-grid">
              {projects.map((project) => (
                <article key={project._id} className="pf-project-card">
                  <div className="pf-project-img">
                    {project.images?.[0] ? (
                      <img src={project.images[0]} alt={project.title} />
                    ) : (
                      <div className="pf-project-placeholder" style={{ background: `${color}18` }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                    <div className="pf-project-overlay">
                      <div className="pf-project-links">
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="pf-project-link" style={{ background: color }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            Live
                          </a>
                        )}
                        {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="pf-project-link pf-project-link-ghost">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pf-project-body">
                    <h3>{project.title}</h3>
                    {project.description && <p>{project.description}</p>}
                    {project.tags?.length > 0 && (
                      <div className="pf-tags">
                        {project.tags.map((tag) => (
                          <span key={tag} className="pf-tag" style={{ color, borderColor: `${color}44`, background: `${color}12` }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <section id="skills" className="pf-section pf-section-alt">
          <div className="pf-container">
            <div className="pf-section-header">
              <span className="pf-badge" style={{ color, borderColor: color }}>Stack</span>
              <h2 className="pf-section-title">Compétences</h2>
            </div>
            <div className="pf-skills-categories">
              {Object.entries(skillGroups).map(([category, catSkills]) => (
                <div key={category} className="pf-skill-category">
                  <h3 className="pf-skill-cat-title">{category}</h3>
                  <div className="pf-skills-list">
                    {catSkills.map((skill) => (
                      <div key={skill._id} className="pf-skill-item">
                        <div className="pf-skill-header">
                          <span className="pf-skill-name">
                            {skill.icon && <span className="pf-skill-icon">{skill.icon}</span>}
                            {skill.name}
                          </span>
                          <span className="pf-skill-pct">{skill.level}%</span>
                        </div>
                        <div className="pf-skill-bar">
                          <div
                            className="pf-skill-fill"
                            style={{ width: `${skill.level}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EXPERIENCE */}
      {experiences.length > 0 && (
        <section id="experience" className="pf-section">
          <div className="pf-container">
            <div className="pf-section-header">
              <span className="pf-badge" style={{ color, borderColor: color }}>Parcours</span>
              <h2 className="pf-section-title">Expérience & Formation</h2>
            </div>
            <div className="pf-timeline-grid">
              {workExp.length > 0 && (
                <div className="pf-timeline-col">
                  <h3 className="pf-timeline-col-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                    Expérience professionnelle
                  </h3>
                  <div className="pf-timeline">
                    {workExp.map((exp) => (
                      <div key={exp._id} className="pf-timeline-item">
                        <div className="pf-timeline-dot" style={{ background: color }} />
                        <div className="pf-timeline-content">
                          <div className="pf-timeline-meta">
                            <span className="pf-timeline-period">
                              {exp.startDate} — {exp.current ? "Présent" : exp.endDate || "…"}
                            </span>
                            {exp.current && <span className="pf-current-badge" style={{ color, borderColor: color }}>Actuel</span>}
                          </div>
                          <h4 className="pf-timeline-title">{exp.title}</h4>
                          <p className="pf-timeline-company">{exp.company}</p>
                          {exp.description && <p className="pf-timeline-desc">{exp.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {eduExp.length > 0 && (
                <div className="pf-timeline-col">
                  <h3 className="pf-timeline-col-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    Formation
                  </h3>
                  <div className="pf-timeline">
                    {eduExp.map((exp) => (
                      <div key={exp._id} className="pf-timeline-item">
                        <div className="pf-timeline-dot" style={{ background: color }} />
                        <div className="pf-timeline-content">
                          <div className="pf-timeline-meta">
                            <span className="pf-timeline-period">
                              {exp.startDate} — {exp.current ? "Présent" : exp.endDate || "…"}
                            </span>
                          </div>
                          <h4 className="pf-timeline-title">{exp.title}</h4>
                          <p className="pf-timeline-company">{exp.company}</p>
                          {exp.description && <p className="pf-timeline-desc">{exp.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="pf-section pf-section-alt">
          <div className="pf-container">
            <div className="pf-section-header">
              <span className="pf-badge" style={{ color, borderColor: color }}>Avis</span>
              <h2 className="pf-section-title">Ce qu&apos;on dit de moi</h2>
            </div>
            <div className="pf-testimonials-grid">
              {testimonials.map((t) => (
                <article key={t._id} className="pf-testimonial-card">
                  <div className="pf-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < t.rating ? color : "#334155"}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p className="pf-testimonial-content">&ldquo;{t.content}&rdquo;</p>
                  <div className="pf-testimonial-author">
                    <div className="pf-author-avatar" style={{ background: `${color}22`, color }}>
                      {t.authorAvatar ? (
                        <img src={t.authorAvatar} alt={t.authorName} />
                      ) : (
                        t.authorName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="pf-author-name">{t.authorName}</p>
                      {t.authorJob && <p className="pf-author-job">{t.authorJob}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact" className="pf-section pf-contact-section">
        <div className="pf-contact-glow" style={{ background: `${color}15` }} />
        <div className="pf-container pf-contact-inner">
          <div className="pf-contact-header">
            <span className="pf-badge" style={{ color, borderColor: color }}>Contact</span>
            <h2 className="pf-section-title">Travaillons ensemble</h2>
            <p className="pf-section-sub">
              Un projet en tête ? Envoyez-moi un message et je vous répondrai rapidement.
            </p>
          </div>
          <ContactForm portfolioId={portfolio._id} primaryColor={color} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pf-footer">
        <p>
          Portfolio de <strong>{user?.name || portfolio.title}</strong> — Créé avec{" "}
          <span style={{ color }}>AgencyFlow</span>
        </p>
      </footer>
    </div>
  );
}
