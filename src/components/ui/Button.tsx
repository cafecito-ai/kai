import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  // design.md: "small hover/tap shifts only. No bouncy mascot behavior."
  // A black button turning purple on hover (the previous primary hover)
  // was a visual surprise nothing else in the app prepared the user for.
  const variants = {
    primary: "bg-ink text-paper hover:bg-ink/85 shadow-soft",
    secondary: "bg-white text-ink border border-line hover:border-ink/35",
    danger: "bg-danger text-white hover:bg-danger/90"
  };
  return (
    <button
      className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
