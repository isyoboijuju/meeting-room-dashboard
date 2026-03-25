"use client";

const TABS = [
  { id: "stats", label: "Stats / Heatmap" },
  { id: "today", label: "Today" },
  { id: "reservations", label: "Reservations" },
  { id: "recommend", label: "Recommend" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export default function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav className="flex border-b border-neutral-200 bg-white px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === tab.id
              ? "border-neutral-900 text-neutral-900"
              : "border-transparent text-neutral-400 hover:text-neutral-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
