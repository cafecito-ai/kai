import { useState } from "react";
import { Button } from "../components/ui/Button";
import type { KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

export function Settings() {
  const { kaiName, kaiTone, setKai } = useUserStore();
  const [name, setName] = useState(kaiName);
  const [tone, setTone] = useState<KaiTone>(kaiTone);
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
        <Button onClick={() => setKai(name, tone)}>Save</Button>
      </section>
    </div>
  );
}
