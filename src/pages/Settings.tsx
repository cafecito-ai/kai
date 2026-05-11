import { useState } from "react";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

export function Settings() {
  const { kaiName, kaiTone, setKai } = useUserStore();
  const [name, setName] = useState(kaiName);
  const [tone, setTone] = useState<KaiTone>(kaiTone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.updateUser({ kaiName: name, kaiTone: tone });
      setSaved(true);
    } catch {
      setSaved(true);
      setError("Saved locally. Connect Clerk and the API to persist across devices.");
    } finally {
      setKai(name, tone);
      setSaving(false);
    }
  }
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-4xl font-black">Settings</h1>
      <section className="space-y-4 rounded-kai border border-ink/10 bg-white p-5">
        <label className="block text-sm font-semibold">
          Kai name
          <input className="focus-ring mt-2 w-full rounded-kai border border-ink/15 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Tone
          <select className="focus-ring mt-2 w-full rounded-kai border border-ink/15 px-3 py-2" value={tone} onChange={(event) => setTone(event.target.value as KaiTone)}>
            <option value="warm">Warm</option>
            <option value="balanced">Balanced</option>
            <option value="direct">Direct</option>
          </select>
        </label>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>{saving ? "Saving" : "Save"}</Button>
          {saved && <span className="text-sm font-semibold text-sage">Saved</span>}
        </div>
        {error && <p className="text-sm font-semibold text-ink/60">{error}</p>}
      </section>
    </div>
  );
}
