"use client";

interface FeatureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  details: string[];
  icon?: React.ReactNode;
}

export default function FeatureInfoModal({
  isOpen, onClose, title, description, details, icon,
}: FeatureInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 animate-[fadeIn_0.2s_ease-out] overflow-hidden">
        {/* Top gradient */}
        <div className="h-2 bg-gradient-to-r from-[#6D28FF] via-purple-500 to-pink-500" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6D28FF]/10 text-[#6D28FF]">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-[#111827]">{title}</h3>
                <p className="text-sm text-[#64748B] mt-0.5">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {details.map((detail, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#6D28FF]/5 transition-colors">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6D28FF] text-white text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-[#475569] leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-5 h-[44px] rounded-xl bg-gradient-to-r from-[#6D28FF] to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-[#6D28FF]/20 transition-all"
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
