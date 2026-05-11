import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-ink text-paper hover:bg-plum shadow-soft",
    secondary: "bg-white text-ink border border-line hover:border-ink/35",
    danger: "bg-danger text-white hover:bg-danger/90"
  };
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
