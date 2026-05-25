import type { GoalCategory } from "../../lib/types";

const CATEGORIES: Array<{ id: GoalCategory; label: string }> = [
  { id: "school", label: "School" },
  { id: "sport", label: "Sport" },
  { id: "fitness", label: "Fitness" },
  { id: "nutrition", label: "Nutrition" },
  { id: "sleep", label: "Sleep" },
  { id: "mental", label: "Mental" },
  { id: "creative", label: "Creative" },
  { id: "music", label: "Music" },
  { id: "business", label: "Business" },
  { id: "charity", label: "Charity" },
  { id: "social", label: "Social" },
  { id: "custom", label: "Custom" }
];

export function GoalCategoryPicker({
  selected,
  onChange
}: {
  selected: GoalCategory;
  onChange: (category: GoalCategory) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Goal category">
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-pressed={selected === category.id}
          onClick={() => onChange(category.id)}
          className={`focus-ring min-h-12 rounded-full border px-3 text-sm font-black ${
            selected === category.id ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
