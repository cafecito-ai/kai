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
  const base = "min-w-0 overflow-hidden rounded-kai border shadow-sm";
  const variants = {
    plain: `${base} border-line bg-white`,
    soft: `${base} border-line bg-warmPaper`,
    dark: `${base} border-ink bg-ink text-paper`,
    danger: `${base} border-danger/25 bg-dangerWash`
  };
  return <section className={`${variants[variant]} ${className}`}>{children}</section>;
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
    <AppSurface className="p-4 sm:p-6 lg:p-7">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="app-title mt-2">{title}</h1>
          {children && <div className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">{children}</div>}
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
      className={`focus-ring group flex min-h-24 min-w-0 flex-col justify-between rounded-kai border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
        active ? "border-ink bg-white" : "border-line bg-white"
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
    <AppPage className="mx-auto max-w-xl">
      <AppSurface className="overflow-hidden p-0">
        <div className="h-1 bg-line">
          <div className="h-full bg-ink transition-all" style={{ width: `${Math.max(8, Math.min(100, progress))}%` }} />
        </div>
        <div className="p-4 sm:p-6">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-black leading-none tracking-normal sm:text-5xl">{title}</h1>
          <div className="mt-5">{children}</div>
          <div className="mt-6 grid gap-2">{footer}</div>
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
      className={`focus-ring w-full rounded-kai border p-4 text-left transition ${
        selected ? "border-ink bg-ink text-paper shadow-soft" : "border-line bg-white text-ink hover:border-ink/35"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
