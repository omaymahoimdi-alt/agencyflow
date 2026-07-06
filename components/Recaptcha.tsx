"use client";

import { useState, useEffect, useRef } from "react";

interface RecaptchaProps {
  onVerify: (token: string | null) => void;
  error?: boolean;
}

export default function Recaptcha({ onVerify, error }: RecaptchaProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "verified" | "error" | "challenge">("idle");
  const [challengeImages, setChallengeImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (error) {
      setStatus("error");
      onVerify(null);
    }
  }, [error, onVerify]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleCheck() {
    if (status === "verified") return;
    setStatus("loading");
    setTimer(0);
    intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const passed = Math.random() > 0.15;
      if (passed) {
        setStatus("verified");
        onVerify("recaptcha-token-" + Date.now());
      } else {
        setStatus("challenge");
        setChallengeImages([
          "https://picsum.photos/seed/a1/150/150",
          "https://picsum.photos/seed/a2/150/150",
          "https://picsum.photos/seed/a3/150/150",
          "https://picsum.photos/seed/a4/150/150",
          "https://picsum.photos/seed/a5/150/150",
          "https://picsum.photos/seed/a6/150/150",
          "https://picsum.photos/seed/a7/150/150",
          "https://picsum.photos/seed/a8/150/150",
          "https://picsum.photos/seed/a9/150/150",
        ]);
        setSelectedImages([]);
        onVerify(null);
      }
    }, 2000 + Math.random() * 1500);
  }

  function handleImageClick(idx: number) {
    setSelectedImages((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function handleChallengeSubmit() {
    if (selectedImages.length === 0) return;
    setStatus("loading");
    setTimer(0);
    intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus("verified");
      onVerify("recaptcha-token-" + Date.now());
    }, 1200 + Math.random() * 800);
  }

  const borderColor =
    status === "error"
      ? "border-red-400"
      : status === "verified"
        ? "border-green-400"
        : "border-slate-300";

  return (
    <div className="space-y-2">
      {status !== "challenge" ? (
        <div
          onClick={handleCheck}
          className={`flex items-center justify-between rounded-lg border ${borderColor} bg-white px-4 py-3 cursor-pointer select-none shadow-sm hover:border-slate-400 transition`}
        >
          <div className="flex items-center gap-3">
            {status === "idle" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-2 border-slate-400 bg-white" />
            )}
            {status === "loading" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                <svg className="h-5 w-5 animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            )}
            {status === "verified" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-green-500 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
            {status === "error" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-2 border-red-400 bg-red-50">
                <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            )}
            <span className={`text-sm font-medium ${
              status === "error" ? "text-red-600" : "text-slate-800"
            }`}>
              Je ne suis pas un robot
            </span>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            {status === "loading" && (
              <span className="text-[10px] text-slate-400">{timer}s</span>
            )}
            <svg className="h-8 w-8" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="8" fill="#1a73e8" />
              <path d="M24 12c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" fill="#fff" opacity="0.2" />
              <path d="M24 16c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 12c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" fill="#fff" />
              <path d="M24 20c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4z" fill="#1a73e8" />
            </svg>
            <span className="text-[8px] font-semibold tracking-wide text-slate-500">reCAPTCHA</span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-violet-300 bg-white shadow-md overflow-hidden">
          <div className="bg-violet-600 px-4 py-2.5 flex items-center gap-2">
            <svg className="h-5 w-5 text-white" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="8" fill="white" opacity="0.3" />
              <path d="M24 12c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" fill="#fff" opacity="0.5" />
              <path d="M24 16c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z" fill="#fff" />
            </svg>
            <span className="text-sm font-semibold text-white">Vérification supplémentaire requise</span>
          </div>
          <div className="p-4">
            <p className="mb-3 text-xs text-slate-600">
              Sélectionnez toutes les images correspondant à la consigne ci-dessous :
            </p>
            <p className="mb-3 text-sm font-semibold text-violet-700">
              Cliquez sur les images contenant un <span className="underline">bâtiment</span>
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {challengeImages.map((src, idx) => (
                <div
                  key={idx}
                  onClick={() => handleImageClick(idx)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                    selectedImages.includes(idx)
                      ? "border-violet-500 ring-2 ring-violet-300"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={src}
                    alt={`Défi ${idx + 1}`}
                    className="h-20 w-full object-cover"
                    loading="lazy"
                  />
                  {selectedImages.includes(idx) && (
                    <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setSelectedImages([]);
                  onVerify(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={handleChallengeSubmit}
                disabled={selectedImages.length === 0}
                className="rounded-lg bg-violet-600 px-5 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition"
              >
                Vérifier
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Veuillez vérifier que vous n&rsquo;êtes pas un robot.
        </p>
      )}

      <div className="flex items-center gap-2 text-[9px] text-slate-400 px-1">
        <span className="font-semibold text-slate-500">Protégé par reCAPTCHA</span>
        <span className="text-slate-300">|</span>
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Confidentialité</a>
        <span className="text-slate-300">|</span>
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Conditions</a>
      </div>
    </div>
  );
}
