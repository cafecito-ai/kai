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
      {pulse && <span className="absolute inset-0 rounded-full bg-[#42D8FF]/18 blur-sm motion-safe:animate-pulse" />}
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="relative drop-shadow-[0_16px_34px_rgba(12,20,38,0.28)]">
        <defs>
          <radialGradient id={nebulaId} cx="35%" cy="24%" r="72%">
            <stop offset="0%" stopColor="#F8FDFF" />
            <stop offset="19%" stopColor="#7DEBFF" />
            <stop offset="46%" stopColor="#4357FF" />
            <stop offset="72%" stopColor="#17133F" />
            <stop offset="100%" stopColor="#050712" />
          </radialGradient>
          <linearGradient id={auroraId} x1="11" y1="12" x2="53" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9DFFCB" />
            <stop offset="38%" stopColor="#46D8FF" />
            <stop offset="68%" stopColor="#8F5CFF" />
            <stop offset="100%" stopColor="#FF8A6B" />
          </linearGradient>
          <linearGradient id={rimId} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="38%" stopColor="#76F4FF" stopOpacity="0.72" />
            <stop offset="72%" stopColor="#9C7CFF" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.56" />
          </linearGradient>
          <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="1.9" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.25 0 0 0 0 0.74 0 0 0 0 1 0 0 0 0.72 0"
            />
            <feBlend in="SourceGraphic" />
          </filter>
          <filter id={hazeId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.55" />
          </filter>
        </defs>
        <circle cx="32" cy="32" r="30" fill="#DDF8FF" opacity="0.34" />
        <circle cx="32" cy="32" r="27" fill={`url(#${nebulaId})`} stroke={`url(#${rimId})`} strokeWidth="2.2" />
        <path
          d="M13.5 36.5c8.2-13.7 28.7-19.4 38.1-8.8 5.2 5.9-1.2 15.5-12.4 18.4-10.9 2.8-24.7-.8-22.8-8.2 1.4-5.3 12.5-7.7 24.1-5.1"
          fill="none"
          stroke={`url(#${auroraId})`}
          strokeLinecap="round"
          strokeWidth="4.7"
          opacity="0.72"
          filter={`url(#${glowId})`}
        />
        <path
          d="M18.7 42.2c7.8 5.9 22.8 5.2 29.3-1.1 4.4-4.2 2.1-9.5-4.4-11.8-7.6-2.7-19.9-.4-24 4.3"
          fill="none"
          stroke="#F7FEFF"
          strokeLinecap="round"
          strokeWidth="1.45"
          opacity="0.82"
        />
        <path
          d="M22 22.4c7.4-5.7 19.2-4.4 25.1 2.2"
          fill="none"
          stroke="#9DFFCB"
          strokeLinecap="round"
          strokeWidth="2.2"
          opacity="0.46"
          filter={`url(#${hazeId})`}
        />
        <circle cx="23.4" cy="21.2" r="1.5" fill="#FFFFFF" opacity="0.94" />
        <circle cx="43.6" cy="23.8" r="1.15" fill="#DDF8FF" opacity="0.9" />
        <circle cx="47.4" cy="38.6" r="1.4" fill="#A6FFCF" opacity="0.85" />
        <circle cx="18.4" cy="34.4" r="0.95" fill="#FFFFFF" opacity="0.9" />
        <circle cx="31.6" cy="15.4" r="0.8" fill="#FFFFFF" opacity="0.74" />
        <circle cx="34.6" cy="49.6" r="0.85" fill="#FFFFFF" opacity="0.72" />
        <path d="M30.5 25.2l1.5 3 3.2.8-3 1.5-.8 3.2-1.5-3-3.2-.8 3-1.5.8-3.2z" fill="#FFFFFF" opacity="0.88" />
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
