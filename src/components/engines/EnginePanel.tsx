import type { ReactNode } from "react";
import { AppHero, AppPage } from "../ui/AppPrimitives";

export function EnginePanel({ title, intro, label = "Engine", accent = "text-plum", children }: { title: string; intro: string; label?: string; accent?: string; children: ReactNode }) {
  return (
    <AppPage>
      <AppHero
        eyebrow={label}
        title={
          <>
            {title} <span className={`font-serif font-normal italic ${accent}`}>engine</span>
          </>
        }
      >
        {intro}
      </AppHero>
      {children}
    </AppPage>
  );
}
