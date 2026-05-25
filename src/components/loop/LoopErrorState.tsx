import { Button } from "../ui/Button";

export function LoopErrorState({
  message,
  offline,
  onRetry,
  onContinue
}: {
  message: string;
  offline?: boolean;
  onRetry: () => void;
  onContinue?: () => void;
}) {
  return (
    <section className="rounded-[22px] border border-care/30 bg-careWash p-4">
      <p className="text-sm font-black text-ink">{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onRetry}>Retry</Button>
        {offline && onContinue && <Button onClick={onContinue}>Keep going offline</Button>}
      </div>
    </section>
  );
}
