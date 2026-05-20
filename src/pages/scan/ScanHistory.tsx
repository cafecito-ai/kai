// /scan/history — list of past scan sessions, with delete (T-028).
//
// Each row is a session (3 angles). Tap a session to view (decrypts in
// memory — no plaintext ever hits localStorage). Delete buttons on every
// session AND every individual photo, per AGENT_PLAN §spec.

import { ArrowLeft, ChevronRight, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/api";
import {
  decryptImage,
  deleteScan,
  deleteScanSession,
  listScanSessions,
  type EncryptedScanRecord,
} from "../../lib/scan-storage";

type ObservationRow = {
  sessionId: string;
  summary: string;
  observationCount: number;
};

const DEVICE_SECRET_KEY = "kai_scan_device_secret_v1";

export function ScanHistory() {
  const [sessions, setSessions] = useState(() => listScanSessions());
  const [observationsBySession, setObservationsBySession] = useState<
    Map<string, ObservationRow>
  >(new Map());
  const userSecret = useMemo(() => {
    if (typeof localStorage === "undefined") return "fallback-no-storage";
    return localStorage.getItem(DEVICE_SECRET_KEY) ?? "fallback-no-storage";
  }, []);

  // Fetch observations once on mount. Failing open is fine — we just
  // show the photo strip without the AI read.
  useEffect(() => {
    let cancelled = false;
    api
      .getScanObservations(20)
      .then((res) => {
        if (cancelled) return;
        const map = new Map<string, ObservationRow>();
        for (const o of res.observations) {
          map.set(o.sessionId, {
            sessionId: o.sessionId,
            summary: o.summary,
            observationCount: o.observations.length,
          });
        }
        setObservationsBySession(map);
      })
      .catch(() => {
        /* offline or no AI — render history without observations */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function refresh() {
    setSessions(listScanSessions());
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/scan"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          scan history
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
        Your scans
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Encrypted on this device. Tap a session to view, or delete any time.
      </p>

      <div className="mt-6 space-y-4">
        {sessions.length === 0 ? (
          <div className="rounded-glass border border-glass-border bg-surface p-6 text-center shadow-card">
            <p className="text-sm text-text-secondary">No scans yet.</p>
            <Link
              to="/scan"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-text-primary px-4 text-sm font-medium text-background shadow-card focus-ring"
            >
              Take your first
            </Link>
          </div>
        ) : (
          sessions.map((s) => (
            <SessionCard
              key={s.sessionId}
              sessionId={s.sessionId}
              capturedAt={s.capturedAt}
              scans={s.scans}
              observation={observationsBySession.get(s.sessionId)}
              userSecret={userSecret}
              onChange={refresh}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SessionCard({
  sessionId,
  capturedAt,
  scans,
  observation,
  userSecret,
  onChange,
}: {
  sessionId: string;
  capturedAt: string;
  scans: EncryptedScanRecord[];
  observation?: ObservationRow;
  userSecret: string;
  onChange: () => void;
}) {
  return (
    <section className="rounded-glass border border-glass-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            session
          </p>
          <p className="text-sm font-medium text-text-primary">
            {formatDate(capturedAt)}
          </p>
        </div>
        <button
          type="button"
          aria-label="Delete entire session"
          onClick={() => {
            deleteScanSession(sessionId);
            onChange();
          }}
          className="
            inline-flex items-center gap-1.5 rounded-full border border-glass-border
            bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary
            transition hover:bg-surface-muted focus-ring
          "
        >
          <Trash2 size={12} aria-hidden="true" /> Delete
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {scans.map((rec) => (
          <ScanThumb
            key={rec.id}
            record={rec}
            userSecret={userSecret}
            onDelete={() => {
              deleteScan(rec.id);
              onChange();
            }}
          />
        ))}
      </div>

      {observation && (
        <Link
          to={`/scan/result/${sessionId}`}
          className="
            mt-3 flex items-center justify-between gap-3 rounded-lg
            border border-l-4 border-glass-border border-l-accent-warm
            bg-surface-muted/40 px-3 py-2.5 text-left
            transition hover:bg-surface-muted focus-ring
          "
        >
          <span className="min-w-0 flex-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              KAI's read · {observation.observationCount} obs
            </span>
            <span className="mt-1 block truncate text-sm text-text-primary">
              {observation.summary}
            </span>
          </span>
          <ChevronRight size={16} className="text-text-muted" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

function ScanThumb({
  record,
  userSecret,
  onDelete,
}: {
  record: EncryptedScanRecord;
  userSecret: string;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    decryptImage(record, userSecret)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        // Decrypt failed — likely because the device secret changed.
        // Leave thumb empty; user can still delete the record.
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [record, userSecret]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-glass-border bg-surface-muted aspect-[3/4]">
      {url ? (
        <img
          src={url}
          alt={`${record.angle} scan`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-text-muted">
          decrypting…
        </div>
      )}
      <p className="absolute left-1.5 top-1.5 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-primary backdrop-blur">
        {record.angle}
      </p>
      <button
        type="button"
        aria-label={`Delete ${record.angle} scan`}
        onClick={onDelete}
        className="
          absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center
          rounded-full bg-background/70 text-text-primary backdrop-blur
          transition hover:bg-background focus-ring
        "
      >
        <Trash2 size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
