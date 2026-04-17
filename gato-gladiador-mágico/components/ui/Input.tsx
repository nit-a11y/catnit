import React from 'react';

export function Input({
  className = "",
  type = "text",
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-[#ffcc33]/80 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          bg-black/40 border-2 border-[#4d3d60] rounded-lg px-4 py-3
          text-white placeholder:text-white/20 outline-none
          focus:border-[#ffcc33] transition-all
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-red-500 text-xs mt-1 ml-1">{error}</span>}
    </div>
  );
}
