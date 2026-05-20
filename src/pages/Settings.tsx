import { useState } from "react";
import { AppHero, AppPage, AppSurface } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

export function Settings() {
  const { kaiName, kaiTone, parentEmail, consentStatus, parentConsentAt, setKai, setConsentPending } = useUserStore();
  const [name, setName] = useState(kaiName);
  const [tone, setTone] = useState<KaiTone>(kaiTone);
  const [consentEmail, setConsentEmail] = useState(parentEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [sendingConsent, setSendingConsent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [consentMessage, setConsentMessage] = useState("");

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

  async function resendConsent() {
    if (!consentEmail.trim()) {
      setConsentMessage("Add a parent email first.");
      return;
    }
    setSendingConsent(true);
    setConsentMessage("");
    try {
      await api.updateUser({ parentEmail: consentEmail.trim() });
      const result = await api.sendParentConsent({ parentEmail: consentEmail.trim(), teenName: name || "Kai user" });
      setConsentPending(consentEmail.trim());
      setConsentMessage(result.emailSent ? "Consent email sent." : "Consent link created. Email sender is not configured yet.");
    } catch {
      setConsentMessage("Could not send consent right now.");
    } finally {
      setSendingConsent(false);
    }
  }

  return (
    <AppPage className="max-w-xl">
      <AppHero eyebrow="app section · settings" title="Tune the companion." >
        Settings control the same Kai experience across home, mental, physical, progress, and circle.
      </AppHero>
      <AppSurface className="space-y-4 p-5">
        <label className="block text-sm font-semibold">
          Kai name
          <input className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Tone
          <select className="field mt-2" value={tone} onChange={(event) => setTone(event.target.value as KaiTone)}>
            <option value="warm">Warm</option>
            <option value="balanced">Balanced</option>
            <option value="direct">Direct</option>
          </select>
        </label>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>{saving ? "Saving" : "Save"}</Button>
          {saved && <span className="text-sm font-semibold text-sage">Saved</span>}
        </div>
        {error && <p className="text-sm font-semibold text-muted">{error}</p>}
      </AppSurface>
      <AppSurface className="space-y-4 p-5">
        <div>
          <p className="eyebrow">Parent consent</p>
          <h2 className="mt-2 font-display text-2xl font-black tracking-normal">{consentLabel(consentStatus)}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Parent consent confirms beta access for teen accounts. It never exposes private answers, goals, meals, or chats.
          </p>
          {parentConsentAt && <p className="mt-2 text-xs font-bold uppercase tracking-wider text-sage">Completed {new Date(parentConsentAt).toLocaleDateString()}</p>}
        </div>
        <label className="block text-sm font-semibold">
          Parent email
          <input className="field mt-2" type="email" value={consentEmail} onChange={(event) => setConsentEmail(event.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={resendConsent} disabled={sendingConsent}>
            {sendingConsent ? "Sending" : consentStatus === "pending" ? "Resend consent" : "Send consent"}
          </Button>
          {consentMessage && <span className="text-sm font-semibold text-muted">{consentMessage}</span>}
        </div>
      </AppSurface>
    </AppPage>
  );
}

function consentLabel(status: string) {
  if (status === "complete") return "Consent complete";
  if (status === "pending") return "Waiting for parent";
  return "Not required";
}
