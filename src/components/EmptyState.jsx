import React from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}) {
  return (
    <div className={`bg-[var(--surface-1)] border border-white/8 rounded-2xl p-6 text-center space-y-3 ${className}`.trim()}>
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Icon size={22} className="text-blue-300" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-black text-white">{title}</h3>
        <p className="text-[12px] text-gray-400 leading-relaxed">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          {primaryAction?.onClick && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-[12px] font-bold border-none cursor-pointer"
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction?.onClick && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-[12px] font-bold border border-white/10 cursor-pointer"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
