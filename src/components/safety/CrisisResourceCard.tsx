import { LifeBuoy, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const RESOURCES = [
  { label: "988 Suicide & Crisis Lifeline", action: "Call or text 988", href: "tel:988" },
  { label: "Crisis Text Line", action: "Text HOME to 741741", href: "sms:741741&body=HOME" },
  { label: "The Trevor Project (LGBTQ+ youth)", action: "Call 1-866-488-7386", href: "tel:18664887386" }
];

/**
 * Spec §7 Level 2: rendered inline in chat directly after Kai's
 * safety acknowledgment message. The conversation stays open — this
 * card is additive, not a replacement.
 */
export function CrisisResourceCard() {
  return (
    <aside
      role="region"
      aria-label="Crisis support resources"
      className="rounded-kai border border-danger/30 bg-dangerWash p-4 text-sm leading-6 text-ink"
    >
      <p className="text-xs font-black uppercase tracking-wider text-danger">If you’re in immediate danger</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-ink">Call 911 (US/Canada) or your local emergency number.</p>
      <ul className="mt-3 grid gap-2">
        {RESOURCES.map((resource) => (
          <li key={resource.label} className="rounded-kai border border-danger/20 bg-white p-3">
            <p className="text-sm font-black text-ink">{resource.label}</p>
            <a
              href={resource.href}
              className="focus-ring mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-danger underline-offset-2 hover:underline"
            >
              <Phone size={14} aria-hidden="true" />
              {resource.action}
            </a>
          </li>
        ))}
      </ul>
      <Link
        to="/crisis"
        className="focus-ring mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3 text-sm font-black text-danger"
      >
        <LifeBuoy size={14} aria-hidden="true" />
        More resources for your country
      </Link>
    </aside>
  );
}
