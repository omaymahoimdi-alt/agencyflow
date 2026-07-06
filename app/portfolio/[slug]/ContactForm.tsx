"use client";

import { useState } from "react";
import Recaptcha from "@/components/Recaptcha";

interface ContactFormProps {
  portfolioId: string;
  primaryColor?: string;
}

export default function ContactForm({ portfolioId, primaryColor = "#6366f1" }: ContactFormProps) {
  const [form, setForm] = useState({
    senderName: "",
    senderEmail: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaToken) {
      setRecaptchaError(true);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioId, ...form }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ senderName: "", senderEmail: "", subject: "", message: "" });
      setRecaptchaToken(null);
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pf-contact-form">
      <div className="pf-form-row">
        <div className="pf-form-group">
          <label htmlFor="senderName">Nom</label>
          <input
            id="senderName"
            name="senderName"
            type="text"
            placeholder="Votre nom"
            value={form.senderName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="pf-form-group">
          <label htmlFor="senderEmail">Email</label>
          <input
            id="senderEmail"
            name="senderEmail"
            type="email"
            placeholder="votre@email.com"
            value={form.senderEmail}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="pf-form-group">
        <label htmlFor="subject">Sujet</label>
        <input
          id="subject"
          name="subject"
          type="text"
          placeholder="Sujet de votre message"
          value={form.subject}
          onChange={handleChange}
        />
      </div>
      <div className="pf-form-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Décrivez votre projet ou votre demande..."
          value={form.message}
          onChange={handleChange}
          required
        />
      </div>

      <Recaptcha onVerify={(token) => { setRecaptchaToken(token); setRecaptchaError(false); }} error={recaptchaError} />

      <button
        type="submit"
        disabled={status === "sending"}
        className="pf-send-btn"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
      >
        {status === "sending" ? (
          <span className="pf-btn-content">
            <span className="pf-spinner" /> Envoi en cours...
          </span>
        ) : (
          <span className="pf-btn-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Envoyer le message
          </span>
        )}
      </button>

      {status === "success" && (
        <div className="pf-toast pf-toast-success">
          ✅ Message envoyé ! Je vous répondrai rapidement.
        </div>
      )}
      {status === "error" && (
        <div className="pf-toast pf-toast-error">
          ❌ Une erreur est survenue. Réessayez.
        </div>
      )}
    </form>
  );
}
