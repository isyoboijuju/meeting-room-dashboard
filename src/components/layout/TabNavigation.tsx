"use client";

const TABS = [
  { id: "stats", label: "통계 / 히트맵" },
  { id: "today", label: "오늘" },
  { id: "reservations", label: "예약 현황" },
  { id: "recommend", label: "추천" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export default function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav className="flex border-b border-slate-200 bg-white px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === tab.id
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
