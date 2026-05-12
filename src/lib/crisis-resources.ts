/**
 * Region-specific crisis resources per spec Section 7 Level 3 (plus plan
 * note in P3-5). The US/Canada baseline was already in the Crisis page;
 * this adds UK/IE, AU/NZ, and an international fallback referencing IASP's
 * directory. Verified current as of the spec date.
 *
 * Hotline numbers are stable but worth re-checking on a regular cadence
 * (helplines occasionally rebrand or change numbers). Bug ops if any
 * resource here is wrong.
 */
export type CrisisRegion = "us_ca" | "uk_ie" | "au_nz" | "international";

export type CrisisResource = {
  name: string;
  description: string;
  phone?: string;
  text?: string;
  url?: string;
};

export const CRISIS_RESOURCES: Record<CrisisRegion, { label: string; resources: CrisisResource[] }> = {
  us_ca: {
    label: "United States & Canada",
    resources: [
      {
        name: "988 Suicide & Crisis Lifeline",
        description: "Call or text 988. 24/7. Free.",
        phone: "988",
        text: "988"
      },
      {
        name: "Crisis Text Line",
        description: "Text HOME to 741741. 24/7. Free.",
        text: "HOME to 741741"
      },
      {
        name: "The Trevor Project (LGBTQ+ youth)",
        description: "Call 1-866-488-7386 or text START to 678-678. 24/7.",
        phone: "1-866-488-7386",
        text: "START to 678-678"
      },
      {
        name: "NEDA Helpline (eating disorders)",
        description: "Call 1-800-931-2237. Mon-Thu 11am-9pm ET / Fri 11am-5pm ET.",
        phone: "1-800-931-2237"
      }
    ]
  },
  uk_ie: {
    label: "United Kingdom & Ireland",
    resources: [
      {
        name: "Samaritans (UK + IE)",
        description: "Call 116 123. 24/7. Free.",
        phone: "116 123"
      },
      {
        name: "Childline (under 19, UK)",
        description: "Call 0800 1111. 24/7. Free.",
        phone: "0800 1111"
      },
      {
        name: "Shout (UK text)",
        description: "Text SHOUT to 85258. 24/7.",
        text: "SHOUT to 85258"
      },
      {
        name: "Pieta (IE)",
        description: "Call 1800 247 247. 24/7. Free.",
        phone: "1800 247 247"
      }
    ]
  },
  au_nz: {
    label: "Australia & New Zealand",
    resources: [
      {
        name: "Lifeline (AU)",
        description: "Call 13 11 14. 24/7. Free.",
        phone: "13 11 14"
      },
      {
        name: "Kids Helpline (AU, 5–25)",
        description: "Call 1800 55 1800. 24/7. Free.",
        phone: "1800 55 1800"
      },
      {
        name: "Lifeline Aotearoa (NZ)",
        description: "Call 0800 543 354 or text 4357. 24/7. Free.",
        phone: "0800 543 354",
        text: "4357"
      },
      {
        name: "Youthline (NZ)",
        description: "Call 0800 376 633 or text 234. 24/7.",
        phone: "0800 376 633",
        text: "234"
      }
    ]
  },
  international: {
    label: "Other countries",
    resources: [
      {
        name: "IASP Crisis Centre Directory",
        description: "Find a crisis line near you. Country-by-country.",
        url: "https://findahelpline.com/"
      },
      {
        name: "Befrienders Worldwide",
        description: "International network of emotional-support lines.",
        url: "https://www.befrienders.org/"
      }
    ]
  }
};

/**
 * Best-effort region pick from a BCP 47 language tag (typically
 * `navigator.language` like "en-US", "en-GB", "fr-FR"). Returns
 * `international` when we can't confidently match the user to a
 * specific region.
 */
export function detectRegion(language?: string | null): CrisisRegion {
  if (!language) return "international";
  const tag = language.toLowerCase();
  const region = tag.split("-")[1] ?? "";

  if (region === "us" || region === "ca") return "us_ca";
  if (region === "gb" || region === "ie") return "uk_ie";
  if (region === "au" || region === "nz") return "au_nz";

  // Some browsers report just "en" / "es" / etc without a country. We default
  // to international rather than guess wrong.
  return "international";
}
