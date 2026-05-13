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
  const base = "min-w-0 overflow-hidden rounded-calm border shadow-sm";
  const variants = {
    plain: `${base} border-line bg-white`,
    soft: `${base} border-line bg-warmPaper`,
    dark: `${base} border-ink bg-ink text-paper`,
    danger: `${base} border-danger/25 bg-dangerWash`
  };
  return <section className={`${variants[variant]} ${className}`}>{children}</section>;
}

export function KaiMark({ size = "md", label = "Kai" }: { size?: "sm" | "md" | "lg"; label?: string }) {
  const sizes = {
    sm: "size-8 text-lg",
    md: "size-11 text-2xl",
    lg: "size-24 text-6xl sm:size-28 sm:text-7xl"
  };
  return (
    <span className="relative inline-grid place-items-center" aria-label={label} role="img">
      <span className={`absolute rounded-full bg-plum/10 ${sizes[size]} motion-safe:animate-pulse`} />
      <span className={`relative grid place-items-center rounded-full bg-ink font-serif italic text-paper shadow-soft ${sizes[size]}`}>k</span>
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
      <div className="min-w-0 rounded-calm border border-line bg-white p-5 shadow-calm sm:p-7 lg:p-9">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl break-words font-display text-3xl font-black leading-[0.96] tracking-normal text-ink sm:text-6xl lg:text-7xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl break-words text-base font-medium leading-7 text-muted">{children}</div>}
        {action && <div className="mt-6 flex flex-col gap-2 sm:flex-row">{action}</div>}
      </div>
      {aside && <div className={`min-w-0 rounded-calm border border-line bg-warmPaper p-5 shadow-sm ${asideClassName}`}>{aside}</div>}
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
          {children && <div className="mt-3 max-w-2xl text-sm font-medium leading-6 text-muted sm:text-base sm:leading-7">{children}</div>}
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
    <section className={`min-w-0 overflow-hidden rounded-calm border border-line bg-white shadow-calm ${className}`}>
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
    <details open={defaultOpen} className="group rounded-calm border border-line bg-white p-5 shadow-sm">
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
