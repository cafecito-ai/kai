import type { ElementType, ReactNode } from "react";

type Tone = "body" | "goals" | "reset" | "care" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  body: "bg-bodyWash text-body",
  goals: "bg-goalsWash text-goals",
  reset: "bg-resetWash text-reset",
  care: "bg-careWash text-care",
  danger: "bg-dangerWash text-danger",
  neutral: "bg-soft text-ink"
};

export function AppPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`app-page ${className}`}>{children}</div>;
}

export function AppSurface({
  children,
  className = "",
  variant = "plain"
}: {
  children: ReactNode;
  className?: string;
  variant?: "plain" | "soft" | "dark" | "danger";
}) {
  const base = "w-full max-w-full min-w-0 overflow-hidden rounded-[30px] border shadow-sm backdrop-blur-xl";
  const variants = {
    plain: `${base} border-white/65 bg-white/80`,
    soft: `${base} border-white/60 bg-white/60`,
    dark: `${base} border-white/10 bg-ink/92 text-paper`,
    danger: `${base} border-danger/25 bg-dangerWash`
  };
  return <section className={`${variants[variant]} ${className}`}>{children}</section>;
}

export function KaiMark({ size = "md", label = "Kai" }: { size?: "sm" | "md" | "lg"; label?: string }) {
  const sizes = {
    sm: 32,
    md: 44,
    lg: 108
  };
  const px = sizes[size];
  return (
    <KaiAvatar size={px} label={label} pulse={size !== "sm"} />
  );
}

export function KaiAvatar({ size = 44, label = "Kai", pulse = false, className = "" }: { size?: number; label?: string; pulse?: boolean; className?: string }) {
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }} aria-label={label} role="img">
      {pulse && <span className="absolute inset-0 rounded-full bg-[#4FC3F7]/20 motion-safe:animate-pulse" />}
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="relative drop-shadow-[0_10px_22px_rgba(15,23,42,0.18)]">
        <defs>
          <radialGradient id="kai-face-glow" cx="33%" cy="24%" r="74%">
            <stop offset="0%" stopColor="#E9FBFF" />
            <stop offset="42%" stopColor="#4FC3F7" />
            <stop offset="100%" stopColor="#2563EB" />
          </radialGradient>
          <linearGradient id="kai-ear-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A3FF12" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#EAF8FF" opacity="0.72" />
        <circle cx="32" cy="32" r="25" fill="url(#kai-face-glow)" stroke="rgba(255,255,255,0.72)" strokeWidth="2.4" />
        <circle cx="23" cy="29" r="3.2" fill="#07111E" />
        <circle cx="41" cy="29" r="3.2" fill="#07111E" />
        <circle cx="22" cy="28" r="1" fill="#FFFFFF" />
        <circle cx="40" cy="28" r="1" fill="#FFFFFF" />
        <path d="M24 40c4.8 4.2 11.2 4.2 16 0" fill="none" stroke="#07111E" strokeLinecap="round" strokeWidth="3.2" />
        <path d="M12 35c-4.2 2.2-6.5 5.1-6.8 8.8" fill="none" stroke="url(#kai-ear-gradient)" strokeLinecap="round" strokeWidth="4.4" />
        <path d="M52 35c4.2 2.2 6.5 5.1 6.8 8.8" fill="none" stroke="url(#kai-ear-gradient)" strokeLinecap="round" strokeWidth="4.4" />
        <path d="M20 18l2.1 4.1 4.4 1.1-4.1 2.1-1.1 4.4-2.1-4.1-4.4-1.1 4.1-2.1L20 18z" fill="#FFFFFF" opacity="0.9" />
      </svg>
    </span>
  );
}

export function SessionHero({
  eyebrow,
  title,
  children,
  action,
  aside,
  asideClassName = ""
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
  asideClassName?: string;
}) {
  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-calm backdrop-blur-xl sm:p-7 lg:p-9">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl break-words font-display text-3xl font-black leading-[0.96] tracking-normal text-ink sm:text-6xl lg:text-7xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl break-words text-base font-medium leading-7 text-muted">{children}</div>}
        {action && <div className="mt-6 flex flex-col gap-2 sm:flex-row">{action}</div>}
      </div>
      {aside && <div className={`min-w-0 rounded-[32px] border border-white/65 bg-white/60 p-5 shadow-sm backdrop-blur-xl ${asideClassName}`}>{aside}</div>}
    </section>
  );
}

export function FlowList({ items }: { items: Array<{ label: string; copy: string }> }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.label} className="grid grid-cols-[2.25rem_1fr] gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-ink text-sm font-black text-paper">{index + 1}</span>
          <span>
            <span className="block text-sm font-black text-ink">{item.label}</span>
            <span className="mt-0.5 block text-sm font-semibold leading-5 text-muted">{item.copy}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function AppHero({
  eyebrow,
  title,
  children,
  action
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <AppSurface className="p-5 sm:p-7 lg:p-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="app-title mt-2">{title}</h1>
          {children && <div className="mt-3 w-full max-w-full break-words text-sm font-medium leading-6 text-muted sm:max-w-2xl sm:text-base sm:leading-7">{children}</div>}
        </div>
        {action && <div className="min-w-0">{action}</div>}
      </div>
    </AppSurface>
  );
}

export function ActionTile({
  to,
  as: Component = "a",
  icon: Icon,
  title,
  copy,
  tone = "neutral",
  active = false,
  className = "",
  ...props
}: {
  to?: string;
  as?: ElementType;
  icon?: ElementType;
  title: string;
  copy?: string;
  tone?: Tone;
  active?: boolean;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <Component
      {...props}
      {...(to ? { to, href: to } : {})}
      className={`focus-ring group flex min-h-24 min-w-0 flex-col justify-between rounded-calm border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
        active ? "border-ink bg-white shadow-soft" : "border-line bg-white"
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <span className={`grid size-10 shrink-0 place-items-center rounded-full ${toneClasses[tone]}`}>
            <Icon size={19} />
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-base font-black leading-tight text-ink">{title}</span>
          {copy && <span className="mt-1 block text-sm font-semibold leading-5 text-muted">{copy}</span>}
        </span>
      </div>
    </Component>
  );
}

export function MetricPill({ label, value, tone = "neutral" }: { label: string; value: string; tone?: Tone }) {
  const valueColor = tone === "neutral" ? "text-ink" : toneClasses[tone].split(" ")[1];
  return (
    <div className="min-w-0 rounded-kai border border-line bg-white px-3 py-2 text-center">
      <p className="truncate text-[10px] font-black uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 truncate text-sm font-black capitalize ${valueColor}`}>{value}</p>
    </div>
  );
}

export function AppWorkspace({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-calm backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

export function SecondaryShelf({
  eyebrow,
  title,
  summary,
  count,
  children,
  defaultOpen = false
}: {
  eyebrow: string;
  title: ReactNode;
  summary?: ReactNode;
  count?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-[30px] border border-white/65 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
      <summary className="focus-ring -m-2 flex cursor-pointer list-none items-center justify-between gap-4 rounded-kai p-2">
        <span className="min-w-0">
          <span className="eyebrow block">{eyebrow}</span>
          <span className="mt-2 block font-display text-2xl font-black leading-none tracking-normal">{title}</span>
          {summary && <span className="mt-2 block text-sm font-semibold leading-6 text-muted">{summary}</span>}
        </span>
        {count && (
          <span className="shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-xs font-black text-muted group-open:bg-ink group-open:text-paper">
            {count}
          </span>
        )}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function StepShell({
  eyebrow,
  title,
  children,
  progress,
  footer
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  progress: number;
  footer: ReactNode;
}) {
  return (
    <AppPage className="mx-auto max-w-4xl">
      <AppSurface className="overflow-hidden p-0">
        <div className="h-1 bg-line">
          <div className="h-full bg-ink transition-all" style={{ width: `${Math.max(8, Math.min(100, progress))}%` }} />
        </div>
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden border-r border-line bg-warmPaper p-8 lg:block">
            <KaiMark size="lg" />
            <p className="mt-6 font-display text-3xl font-black leading-none">One answer at a time.</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">Kai uses this to pick a starting lane. You can change it later.</p>
          </div>
          <div className="p-5 sm:p-7">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-2 font-display text-3xl font-black leading-none tracking-normal sm:text-5xl">{title}</h1>
            <div className="mt-5">{children}</div>
            <div className="mt-6 grid gap-2">{footer}</div>
          </div>
        </div>
      </AppSurface>
    </AppPage>
  );
}

export function ChoiceCard({
  selected,
  children,
  className = "",
  ...props
}: {
  selected?: boolean;
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <button
      type="button"
      className={`focus-ring w-full rounded-calm border p-4 text-left transition ${
        selected ? "border-ink bg-ink text-paper shadow-soft" : "border-line bg-white text-ink hover:border-ink/35"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
