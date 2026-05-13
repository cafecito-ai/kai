import { LifeBuoy } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Shared crisis-resources link used across sensitive primers
 * (substances, trauma, body image, online safety, sex ed, etc.).
 *
 * Previously each primer's persistent danger card enumerated specific
 * US hotlines (988, NCMEC, RAINN, Childhelp, ANAD, NEDA, Planned
 * Parenthood, SAMHSA, etc.). Codex review flagged this as a P1 on
 * the trauma primer: for non-US teens, the persistent card showed
 * the wrong emergency numbers before they reached the (region-aware)
 * Crisis page.
 *
 * This shared component defers to the Crisis page as the single
 * source of truth for hotline routing. Article body text can still
 * reference specific hotlines factually (e.g., a paragraph about
 * sexual assault can name RAINN with its US number) — what changes
 * is that the **persistent danger card at the top of each primer**
 * is now generic and routes through /crisis.
 */

type Props = {
  /** Visual treatment. `danger` = danger-color card used by sensitive
   * primers. `subtle` = sage card used by softer primers
   * (gratitude / purpose / etc.). */
  tone?: "danger" | "subtle";
  /** Optional intro line above the link. Defaults to a generic
   * "if something is happening right now" message. */
  intro?: string;
  /** Optional custom CTA label. Defaults to "Crisis resources". */
  ctaLabel?: string;
};

export function CrisisLink({ tone = "danger", intro, ctaLabel = "Crisis resources" }: Props) {
  const intoText =
    intro ??
    (tone === "danger"
      ? "If something is happening right now — for you or a friend — the Crisis page has hotlines and resources for your country."
      : "Need to talk to someone? The Crisis page has free hotlines for your country.");

  if (tone === "subtle") {
    return (
      <div className="mt-3 rounded-kai border border-sage/30 bg-lime/40 p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-sage">Real resources, no shame</p>
        <p className="mt-1 text-sm leading-5 text-ink">{intoText}</p>
        <Link
          to="/crisis"
          className="focus-ring mt-2 inline-flex items-center gap-1 rounded-kai border border-sage/40 bg-white px-3 py-1.5 text-xs font-bold text-sage hover:bg-sage/10"
        >
          <LifeBuoy size={14} aria-hidden="true" />
          {ctaLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-kai border border-danger/30 bg-danger/5 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-danger">If something is happening right now</p>
      <p className="mt-1 text-sm leading-5 text-ink">{intoText}</p>
      <Link
        to="/crisis"
        className="focus-ring mt-2 inline-flex items-center gap-1 rounded-kai border border-danger/40 bg-white px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/5"
      >
        <LifeBuoy size={14} aria-hidden="true" />
        {ctaLabel}
      </Link>
    </div>
  );
}
