import type { ReactNode } from "react";
import { AppPage, FlowList, KaiMark, SessionHero } from "../ui/AppPrimitives";

export function EnginePanel({ title, intro, label = "Engine", accent = "text-plum", children }: { title: string; intro: string; label?: string; accent?: string; children: ReactNode }) {
  return (
    <AppPage>
      <SessionHero
        eyebrow={label}
        title={
          <>
            {title} <span className={`font-serif font-normal italic ${accent}`}>lane</span>
          </>
        }
        aside={
          <div className="flex h-full flex-col justify-between gap-6">
            <KaiMark size="lg" />
            <FlowList
              items={[
                { label: "Start here", copy: "Use the first tool on the page." },
                { label: "Keep it small", copy: "One saved rep counts." },
                { label: "Come back later", copy: "History and guides stay below." }
              ]}
            />
          </div>
        }
      >
        {intro}
      </SessionHero>
      {children}
    </AppPage>
  );
}
