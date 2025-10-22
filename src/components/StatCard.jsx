import React from "react";

/**
 * StatCard: sleek floating glass card with soft border + inner highlight.
 */
export default function StatCard({ title, subtitle, children, right }) {
  return (
    <div className="relative rounded-2xl group">
      {/* Outer floating glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent/10 via-white/5 to-accent2/10 opacity-40 group-hover:opacity-70 transition-all blur-sm"></div>

      {/* Main glass card */}
      <div className="relative glass-card border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-2xl p-6 transition-all">
        {/* Inner border effect */}
        <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none"></div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-400">{title}</div>
            <div className="mt-2 text-white text-2xl font-semibold">{children}</div>
            {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
          </div>
          {right && <div className="ml-auto">{right}</div>}
        </div>
      </div>
    </div>
  );
}
