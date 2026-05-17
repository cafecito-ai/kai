import { ChevronLeft, MessageCircle, ShieldCheck, Sparkles, Trophy, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

type SessionDetail = Awaited<ReturnType<typeof api.getDemoSession>>["session"];

export function OpsDemoSession() {
  const { sessionId = "" } = useParams<{ sessionId: string }>();
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "notfound" | "error">("loading");
  const [session, setSession] = useState<SessionDetail | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setState("notfound");
      return;
    }
    let cancelled = false;
    api
      .getDemoSession(sessionId)
      .then((result) => {
        if (cancelled) return;
        setSession(result.session);
        setState("ok");
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err.message.includes("403")) setState("forbidden");
        else if (err.message.includes("404")) setState("notfound");
        else setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (state === "loading") return <p className="text-sm text-muted">Loading session…</p>;
  if (state === "forbidden") {
    return (
      <SimpleNotice icon={<ShieldCheck />} title="Ops access required." />
    );
  }
  if (state === "notfound") {
    return <SimpleNotice title={`No session with id ${sessionId.slice(0, 12)}…`} />;
  }
  if (state === "error" || !session) {
    return <p className="text-sm text-coral">Could not load this session. Try again in a moment.</p>;
  }

  const build = (session.build ?? {}) as Record<string, unknown>;
  const get = (k: string): string =>
    typeof build[k] === "string" ? (build[k] as string) : "";
  const vibes = Array.isArray(build.vibes) ? (build.vibes as string[]) : [];

  return (
    <section className="space-y-5">
      <Link to="/ops/demo-sessions" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink">
        <ChevronLeft size={16} /> back to sessions
      </Link>

      <header className="rounded-kai border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">demo session</p>
            <h1 className="mt-1 font-display text-2xl font-black">
              {session.reviewerName || session.reviewerEmail || "Anonymous teen"}
            </h1>
            {session.reviewerEmail && session.reviewerName && (
              <p className="mt-1 text-sm text-muted">{session.reviewerEmail}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              session {session.sessionId.slice(0, 18)}… · act {session.lastAct}/6 · updated {formatRelative(session.updatedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {session.completedAt ? (
              <span className="rounded-full bg-[#E8F4EC] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sage">
                shipped {formatRelative(session.completedAt)}
              </span>
            ) : (
              <span className="rounded-full bg-paper px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                in progress
              </span>
            )}
            <p className="text-[10px] text-muted/80">started {formatRelative(session.createdAt)}</p>
          </div>
        </div>
      </header>

      <Card title="Build" icon={<Sparkles size={16} />}>
        <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-6">
          <Row label="Their name">{get("firstName") || <Muted>not given</Muted>}</Row>
          <Row label="Kai name">{get("kaiName") || "Kai"}</Row>
          <Row label="Kai tone">{get("kaiTone") || "balanced"}</Row>
          <Row label="Art style">{get("art") || "—"}</Row>
          <Row label="First move">{get("firstMove") || "—"}</Row>
          <Row label="Vibes">
            {vibes.length === 0 ? <Muted>none picked</Muted> : vibes.join(" · ")}
          </Row>
        </dl>
      </Card>

      {session.chat && session.chat.length > 0 && (
        <Card title="Act 3 — free chat with Kai" icon={<MessageCircle size={16} />}>
          <TranscriptList turns={session.chat} />
        </Card>
      )}

      {session.tried.includes("win") && get("goalText") && (
        <Card title="One win" icon={<Trophy size={16} />}>
          <blockquote className="rounded-kai border-l-4 border-sage bg-[#F1F8F3] px-4 py-3 text-sm font-semibold leading-6">
            “{get("goalText")}”
          </blockquote>
        </Card>
      )}

      {session.tried.includes("feelings") && (
        <Card title="Feelings check" icon={<MessageCircle size={16} />}>
          {session.feelings?.transcript && session.feelings.transcript.length > 0 ? (
            <TranscriptList turns={session.feelings.transcript} />
          ) : (
            <Muted>{get("feelingsSummary") || "completed, but no transcript saved"}</Muted>
          )}
        </Card>
      )}

      {session.tried.includes("fuel") && (
        <Card title="Fuel snap" icon={<UtensilsCrossed size={16} />}>
          {session.meal && Array.isArray((session.meal as Record<string, unknown>).items) ? (
            <FuelResult meal={session.meal} />
          ) : (
            <Muted>{get("mealSummary") || "completed, no item detail saved"}</Muted>
          )}
        </Card>
      )}

      {(get("mustHave") || get("hardNo") || get("tester")) && (
        <Card title="Build brief notes" icon={<Sparkles size={16} />}>
          <dl className="grid gap-3 text-sm">
            {get("mustHave") && <Row label="Must have">{get("mustHave")}</Row>}
            {get("hardNo") && <Row label="Hard no">{get("hardNo")}</Row>}
            {get("tester") && <Row label="Who tests first">{get("tester")}</Row>}
          </dl>
        </Card>
      )}

      <details className="rounded-kai border border-line bg-white p-3 text-xs text-muted">
        <summary className="cursor-pointer font-bold">Raw payload</summary>
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words text-[11px]">
          {JSON.stringify(session, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function SimpleNotice({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <section className="mx-auto max-w-lg rounded-kai border border-line bg-white p-5 shadow-sm">
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-full bg-[#FFF1EB] text-coral">{icon}</div>}
      <h1 className="font-display text-xl font-black">{title}</h1>
    </section>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-black">
        {icon && <span className="text-plum">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-muted">{children}</span>;
}

function TranscriptList({ turns }: { turns: Array<{ role: "user" | "assistant"; content: string }> }) {
  return (
    <ol className="space-y-2">
      {turns.map((turn, i) => (
        <li
          key={i}
          className={`rounded-kai border px-3 py-2 text-sm leading-6 ${
            turn.role === "user"
              ? "border-plum/30 bg-[#F2EFFF]"
              : "border-line bg-paper"
          }`}
        >
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-muted">
            {turn.role === "user" ? "teen" : "kai"}
          </p>
          <p>{turn.content}</p>
        </li>
      ))}
    </ol>
  );
}

function FuelResult({ meal }: { meal: Record<string, unknown> }) {
  const items = Array.isArray(meal.items) ? (meal.items as Array<Record<string, unknown>>) : [];
  const confidence = typeof meal.confidence === "string" ? meal.confidence : "";
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
        confidence: {confidence || "—"}
      </p>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, i) => {
          const name = String(item.name ?? "");
          const grams = typeof item.estimatedGrams === "number" ? item.estimatedGrams : null;
          const nutrition = (item.nutrition as Record<string, unknown> | undefined) ?? {};
          const kcal = typeof nutrition.calories === "number" ? Math.round(nutrition.calories) : null;
          return (
            <li key={i} className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{name}</span>
              <span className="text-[12px] text-muted">
                {grams ? `~${grams}g` : ""}
                {kcal ? ` · ~${kcal} kcal` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.round((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
