"use client";

import { useState, useCallback } from "react";
import { useCalendarStats } from "@/hooks/useCalendarStats";
import WeekSelector from "./WeekSelector";
import KpiCards from "./KpiCards";
import RoomUsageChart from "./RoomUsageChart";
import WeeklyHeatmap from "./WeeklyHeatmap";

function getMondayISO(date: Date): string {
  const dow = date.getDay();
  const mondayOffset = (dow + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - mondayOffset);
  return monday.toISOString().slice(0, 10);
}

function shiftWeek(iso: string, delta: number): string {
  const date = new Date(iso + "T00:00:00");
  date.setDate(date.getDate() + delta * 7);
  return date.toISOString().slice(0, 10);
}

async function exportPDF(month: string): Promise<void> {
  const res = await fetch(`/api/report/monthly?month=${month}`);
  if (!res.ok) throw new Error(`Report fetch failed: HTTP ${res.status}`);
  const report = await res.json();

  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DSRV Meeting Room Report", pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Month: ${report.month}`, pageW / 2, y, { align: "center" });
  y += 12;

  // KPI summary
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24);
  doc.text("Summary", 20, y);
  y += 7;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Bookings: ${report.totalBookings}`, 20, y);
  y += 6;
  doc.text(`Average Duration: ${report.avgDuration} minutes`, 20, y);
  y += 12;

  // Room stats table header
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Room Statistics", 20, y);
  y += 7;

  const colWidths = [60, 40, 35, 40];
  const colX = [20, 80, 120, 155];
  const headers = ["Room", "Occupancy", "Bookings", "Avg Duration"];

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(245, 245, 244);
  doc.rect(18, y - 4, pageW - 36, 7, "F");
  headers.forEach((h, i) => {
    doc.text(h, colX[i], y);
  });
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40);
  for (const room of report.rooms) {
    doc.text(String(room.name ?? room.roomId), colX[0], y, { maxWidth: colWidths[0] - 2 });
    doc.text(`${room.weeklyOccupancy}%`, colX[1], y);
    doc.text(String(room.totalBookings), colX[2], y);
    doc.text(`${room.avgDurationMinutes}m`, colX[3], y);
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  const filename = `dsrv-report-${report.month}.pdf`;
  doc.save(filename);
}

export default function StatsView() {
  const [weekOf, setWeekOf] = useState(() => getMondayISO(new Date()));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, loading, error } = useCalendarStats(weekOf);

  const handlePrev = useCallback(() => {
    setWeekOf((w) => shiftWeek(w, -1));
  }, []);

  const handleNext = useCallback(() => {
    setWeekOf((w) => shiftWeek(w, 1));
  }, []);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    const month = weekOf.slice(0, 7);
    try {
      await exportPDF(month);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [weekOf]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <WeekSelector weekOf={weekOf} onPrev={handlePrev} onNext={handleNext} />
        <div className="flex items-center gap-3">
          {exportError && (
            <span className="text-xs text-red-500">{exportError}</span>
          )}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="text-sm px-4 py-2 rounded-lg border border-stone-300 bg-white text-neutral-700 hover:bg-stone-50 hover:border-stone-400 hover:shadow-sm active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{ borderColor: "#C4A882" }}
          >
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          Failed to load stats: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-neutral-200 rounded-xl p-5 h-24 animate-pulse"
                >
                  <div className="h-3 bg-neutral-100 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-neutral-100 rounded w-2/3" />
                </div>
              ))}
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 h-72 animate-pulse">
              <div className="h-3 bg-neutral-100 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 bg-neutral-100 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-5 h-[420px] animate-pulse">
            <div className="h-3 bg-neutral-100 rounded w-1/3 mb-4" />
          </div>
        </div>
      )}

      {/* Main content */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
          {/* Left: KPI + bar chart */}
          <div className="space-y-4">
            <KpiCards rooms={data.rooms} />
            <RoomUsageChart rooms={data.rooms} />
          </div>

          {/* Right: Heatmap */}
          <WeeklyHeatmap cells={data.heatmap} />
        </div>
      )}
    </div>
  );
}
