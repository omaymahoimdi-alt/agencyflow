"use client";

import { useState, useEffect, useCallback } from "react";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

export default function GuidedTour({ steps, isOpen, onClose, onFinish }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, placement: "bottom" as string });

  const updatePosition = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const placement = step.placement || "bottom";
    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = rect.top - 16;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + 16;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 16;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 16;
        break;
    }
    setTooltipPos({ top, left, placement });
  }, [currentStep, steps]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    updatePosition();
  }, [currentStep, updatePosition]);

  if (!isOpen || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  function getTargetRect() {
    const el = document.querySelector(step.target) as HTMLElement;
    return el ? el.getBoundingClientRect() : null;
  }

  const targetRect = getTargetRect();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[999]"
        style={{ pointerEvents: "none" as const }}
      >
        {/* SVG spotlight with cutout */}
        <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
          <defs>
            <mask id="tour-spotlight">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx={12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#tour-spotlight)"
          />
        </svg>
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[1000] w-80 animate-[fadeIn_0.2s_ease-out]"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: tooltipPos.placement === "top" ? "translate(-50%, -100%)"
            : tooltipPos.placement === "bottom" ? "translate(-50%, 0)"
            : tooltipPos.placement === "left" ? "translate(-100%, -50%)"
            : "translate(0, -50%)",
        }}
      >
        {/* Arrow */}
        <div
          className="absolute w-3 h-3 bg-white rotate-45 border-l border-t border-slate-200"
          style={{
            [tooltipPos.placement === "top" ? "bottom" : "top"]: "-6px",
            [tooltipPos.placement === "left" ? "right" : "left"]: "50%",
            marginLeft: tooltipPos.placement === "top" || tooltipPos.placement === "bottom" ? "-6px" : "0",
            marginTop: tooltipPos.placement === "left" || tooltipPos.placement === "right" ? "-6px" : "0",
            [tooltipPos.placement === "bottom" ? "top" : "bottom"]: tooltipPos.placement === "top" ? "auto" : "-6px",
            [tooltipPos.placement === "right" ? "left" : "right"]: tooltipPos.placement === "left" ? "auto" : "-6px",
            display: tooltipPos.placement === "top" ? "block" : tooltipPos.placement === "bottom" ? "block" : tooltipPos.placement === "left" ? "block" : "block",
          }}
        />
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5">
          {/* Step indicator + Close */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6D28FF] bg-[#6D28FF]/10 px-2.5 py-1 rounded-full">
              {currentStep + 1} / {steps.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <h3 className="text-base font-bold text-[#111827] mb-1.5">{step.title}</h3>
          <p className="text-sm text-[#64748B] leading-relaxed">{step.description}</p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Passer
            </button>
            <div className="flex items-center gap-2">
              {!isLast ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
                  className="text-sm font-semibold text-white bg-gradient-to-r from-[#6D28FF] to-purple-600 px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-[#6D28FF]/20 transition-all"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFinish?.();
                  }}
                  className="text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-green-500/20 transition-all"
                >
                  Terminer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click overlay to advance */}
      <div className="fixed inset-0 z-[998] cursor-pointer" onClick={() => {
        if (isLast) {
          onClose();
          onFinish?.();
        } else {
          setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        }
      }} />
    </>
  );
}
