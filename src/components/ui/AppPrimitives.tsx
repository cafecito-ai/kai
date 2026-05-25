import { useId, type ElementType, type ReactNode } from "react";

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
  const id = useId().replace(/:/g, "");
  const nebulaId = `kai-nebula-${id}`;
  const auroraId = `kai-aurora-${id}`;
  const rimId = `kai-rim-${id}`;
  const glowId = `kai-glow-${id}`;
  const hazeId = `kai-haze-${id}`;

  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }} aria-label={label} role="img">
      {pulse && <span className="absolute inset-0 rounded-full bg-[#8F5CFF]/18 blur-sm motion-safe:animate-pulse" />}
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="relative drop-shadow-[0_16px_34px_rgba(38,20,74,0.34)]">
        <defs>
          <radialGradient id={nebulaId} cx="38%" cy="28%" r="74%">
            <stop offset="0%" stopColor="#F8F1FF" />
            <stop offset="18%" stopColor="#B892FF" />
            <stop offset="44%" stopColor="#5E34E8" />
            <stop offset="72%" stopColor="#1B123A" />
            <stop offset="100%" stopColor="#05050E" />
          </radialGradient>
          <linearGradient id={auroraId} x1="13" y1="13" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F4E8FF" />
            <stop offset="35%" stopColor="#9A6BFF" />
            <stop offset="68%" stopColor="#5B2FE5" />
            <stop offset="100%" stopColor="#D9B8FF" />
          </linearGradient>
          <linearGradient id={rimId} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.88" />
            <stop offset="38%" stopColor="#A98CFF" stopOpacity="0.62" />
            <stop offset="72%" stopColor="#6F46F5" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#F1E7FF" stopOpacity="0.52" />
          </linearGradient>
          <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="1.9" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.53 0 0 0 0 0.32 0 0 0 0 1 0 0 0 0.78 0"
            />
            <feBlend in="SourceGraphic" />
          </filter>
          <filter id={hazeId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.55" />
          </filter>
        </defs>
        <circle cx="32" cy="32" r="30" fill="#CDBBFF" opacity="0.22" />
        <circle cx="32" cy="32" r="27" fill={`url(#${nebulaId})`} stroke={`url(#${rimId})`} strokeWidth="2" />
        <path
          d="M16 36.8c5.7-12.6 26.5-16.4 34.2-6.7 4.9 6.2-2.4 15-14 16.8-10.7 1.7-21.6-2.7-19.4-9.1 1.9-5.4 13.8-6.6 24.4-2.5"
          fill="none"
          stroke={`url(#${auroraId})`}
          strokeLinecap="round"
          strokeWidth="4.35"
          opacity="0.78"
          filter={`url(#${glowId})`}
        />
        <path
          d="M20.2 41.6c7.2 5 20.1 4.7 26.5-.7 4-3.4 2.2-8-3.5-10.1-7.1-2.7-17.8-.7-22 3.1"
          fill="none"
          stroke="#F8F1FF"
          strokeLinecap="round"
          strokeWidth="1.45"
          opacity="0.86"
        />
        <path
          d="M22.8 22.5c7-4.9 17.9-3.7 23.4 2.2"
          fill="none"
          stroke="#CDBBFF"
          strokeLinecap="round"
          strokeWidth="2"
          opacity="0.46"
          filter={`url(#${hazeId})`}
        />
        <circle cx="23.3" cy="21.4" r="1.45" fill="#FFFFFF" opacity="0.92" />
        <circle cx="42.9" cy="24.1" r="1.1" fill="#F4E8FF" opacity="0.86" />
        <circle cx="47.1" cy="38.3" r="1.25" fill="#D9B8FF" opacity="0.82" />
        <circle cx="18.8" cy="34.2" r="0.9" fill="#FFFFFF" opacity="0.88" />
        <circle cx="31.2" cy="15.8" r="0.75" fill="#FFFFFF" opacity="0.7" />
        <circle cx="35" cy="49.2" r="0.8" fill="#F4E8FF" opacity="0.7" />
        <path d="M30.5 25.5l1.45 2.9 3.05.75-2.88 1.45-.76 3.05-1.45-2.9-3.05-.75 2.88-1.45.76-3.05z" fill="#FFFFFF" opacity="0.9" />
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
