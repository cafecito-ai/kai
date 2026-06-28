// Voice-first onboarding (v2) — the flow controller.
//
// Owns the conversation engine + speech, and renders the current phase:
//   welcome → conversation → plan(generating → tour) → complete → /home
//
// Lives behind a feature flag on its own route (/onboarding-v2). The existing
// Onboarding stays the live default until Lev approves this on staging. Completion
// is persisted via the SAME signal as the live flow (api.updateUser +
// userStore), so RequireOnboarding and the rest of the app are unaffected.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingComplete } from "../../components/onboarding/OnboardingComplete";
import { OptionalGuidedTour } from "../../components/onboarding/OptionalGuidedTour";
import { PlanGenerationSequence } from "../../components/onboarding/PlanGenerationSequence";
import { VoiceConversation } from "../../components/onboarding/VoiceConversation";
import { WelcomeScreen } from "../../components/onboarding/WelcomeScreen";
import { useConversationEngine } from "../../lib/onboarding/useConversationEngine";
import { useSpeech } from "../../lib/useSpeech";
import { useStorageUserId } from "../../lib/storage-user-id";
import { useUserStore } from "../../stores/userStore";

export function OnboardingV2() {
  const navigate = useNavigate();
  const userId = useStorageUserId();
  const onboardingCompletedAt = useUserStore((s) => s.onboardingCompletedAt);
  const engine = useConversationEngine("voice");
  const { state, begin, setInputMode, sendUtterance, enterPlan, enterComplete } = engine;
  const [planStage, setPlanStage] = useState<"generating" | "tour">("generating");

  const speech = useSpeech({ onFinalTranscript: sendUtterance });

  // Already onboarded → straight to the app (unless QA forced a re-run).
  useEffect(() => {
    let forced = false;
    try {
      forced = localStorage.getItem("kai_force_onboarding") === "1";
    } catch {
      /* ignore */
    }
    if (onboardingCompletedAt && !forced) navigate("/home", { replace: true });
  }, [navigate, onboardingCompletedAt]);

  // Once we have enough, let the final line land, then move to plan generation.
  useEffect(() => {
    if (state.phase === "conversation" && state.readyForPlan) {
      const t = setTimeout(() => enterPlan(), 1600);
      return () => clearTimeout(t);
    }
  }, [state.phase, state.readyForPlan, enterPlan]);

  function handleBegin(mode: "voice" | "typed") {
    setInputMode(mode);
    begin();
  }

  switch (state.phase) {
    case "welcome":
      return <WelcomeScreen onBegin={handleBegin} voiceSupported={speech.supported.recognition} />;

    case "conversation":
      return <VoiceConversation state={state} onUserUtterance={sendUtterance} speech={speech} />;

    case "plan":
      if (planStage === "generating") {
        return (
          <PlanGenerationSequence
            draft={state.draft}
            userId={userId}
            variant="cinematic"
            onDone={() => setPlanStage("tour")}
          />
        );
      }
      return <OptionalGuidedTour onComplete={enterComplete} />;

    case "complete":
      return (
        <OnboardingComplete displayName={state.draft.firstName} onEnter={() => navigate("/home", { replace: true })} />
      );

    default:
      return null;
  }
}
