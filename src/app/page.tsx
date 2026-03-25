"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import TabNavigation, { TabId } from "@/components/layout/TabNavigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("stats");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      {session ? (
        <>
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="p-6">
            {activeTab === "stats" && <div className="text-neutral-400">Stats / Heatmap — loading...</div>}
            {activeTab === "today" && <div className="text-neutral-400">Today View — loading...</div>}
            {activeTab === "reservations" && <div className="text-neutral-400">Reservations — loading...</div>}
            {activeTab === "recommend" && <div className="text-neutral-400">Recommend — loading...</div>}
          </main>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="text-neutral-400">Please sign in to view the dashboard.</p>
        </div>
      )}
    </div>
  );
}
