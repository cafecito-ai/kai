const META_KEY = "kai_day_zero_meta_v1";
const DB_NAME = "kai_day_zero_v1";
const STORE_NAME = "videos";

export type DayZeroMeta = {
  id: string;
  createdAt: string;
  durationMs: number;
  quote?: string;
};

export function readDayZeroMeta(): DayZeroMeta | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DayZeroMeta>;
    if (!parsed.id || !parsed.createdAt) return null;
    return {
      id: parsed.id,
      createdAt: parsed.createdAt,
      durationMs: typeof parsed.durationMs === "number" ? parsed.durationMs : 0,
      quote: typeof parsed.quote === "string" ? parsed.quote : undefined,
    };
  } catch {
    return null;
  }
}

export async function saveDayZeroVideo(input: {
  blob: Blob;
  durationMs: number;
  quote?: string;
}): Promise<DayZeroMeta> {
  const meta: DayZeroMeta = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    durationMs: input.durationMs,
    quote: input.quote?.trim().slice(0, 140) || undefined,
  };
  const db = await openDb();
  await putBlob(db, meta.id, input.blob);
  localStorage.setItem(META_KEY, JSON.stringify(meta));
  window.dispatchEvent(new Event("kai:day-zero-changed"));
  return meta;
}

export async function getDayZeroVideoUrl(id: string): Promise<string | null> {
  const db = await openDb();
  const blob = await getBlob(db, id);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deleteDayZeroVideo(): Promise<void> {
  const meta = readDayZeroMeta();
  if (meta) {
    const db = await openDb();
    await deleteBlob(db, meta.id);
  }
  localStorage.removeItem(META_KEY);
  window.dispatchEvent(new Event("kai:day-zero-changed"));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putBlob(db: IDBDatabase, id: string, blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getBlob(db: IDBDatabase, id: string): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
    req.onerror = () => reject(req.error);
  });
}

function deleteBlob(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
