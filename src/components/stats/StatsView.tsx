"use client";

import { useState, useCallback } from "react";
import { useCalendarStats, StatsQuery } from "@/hooks/useCalendarStats";
import PeriodSelector from "./PeriodSelector";
import KpiCards from "./KpiCards";
import RoomUsageChart from "./RoomUsageChart";
import WeeklyHeatmap from "./WeeklyHeatmap";
import { toLocalISO, getMondayOfWeek } from "@/lib/date-utils";

async function exportPDF(month: string): Promise<void> {
  const res = await fetch(`/api/report/monthly?month=${month}`);
  if (!res.ok) throw new Error(`Report fetch failed: HTTP ${res.status}`);
  const report = await res.json();

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DSRV 회의실 리포트", pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`기간: ${report.month}`, pageW / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24);
  doc.text("요약", 20, y);
  y += 7;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`총 예약 수: ${report.totalBookings}`, 20, y);
  y += 6;
  doc.text(`평균 소요 시간: ${report.avgDuration}분`, 20, y);
  y += 12;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("회의실별 통계", 20, y);
  y += 7;

  const colX = [20, 80, 120, 155];
  const headers = ["회의실", "사용률", "예약 수", "평균 시간"];

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(241, 245, 249);
  doc.rect(18, y - 4, pageW - 36, 7, "F");
  headers.forEach((h, i) => {
    doc.text(h, colX[i], y);
  });
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40);
  for (const room of report.rooms) {
    doc.text(String(room.name ?? room.roomId), colX[0], y, { maxWidth: 58 });
    doc.text(`${room.weeklyOccupancy}%`, colX[1], y);
    doc.text(String(room.totalBookings), colX[2], y);
    doc.text(`${room.avgDurationMinutes}m`, colX[3], y);
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  doc.save(`dsrv-report-${report.month}.pdf`);
}

function getMonthFromQuery(query: StatsQuery): string {
  switch (query.mode) {
    case "week":
      return query.weekOf.slice(0, 7);
    case "month":
      return query.month;
    case "custom":
      return query.startDate.slice(0, 7);
  }
}

const PERIOD_SUB: Record<StatsQuery["mode"], string> = {
  week: "이번 주",
  month: "이번 달",
  custom: "선택 기간",
};

const HEATMAP_TITLE: Record<StatsQuery["mode"], string> = {
  week: "주간 예약 히트맵",
  month: "월간 예약 히트맵",
  custom: "기간 예약 히트맵",
};

export default function StatsView() {
  const [query, setQuery] = useState<StatsQuery>(() => ({
    mode: "week",
    weekOf: toLocalISO(getMondayOfWeek(new Date())),
  }));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, loading, error } = useCalendarStats(query);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    const month = getMonthFromQuery(query);
    try {
      await exportPDF(month);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodSelector query={query} onQueryChange={setQuery} />
        <div className="flex items-center gap-3">
          {exportError && (
            <span className="text-xs text-red-500">{exportError}</span>
          )}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="text-sm px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-indigo-300 hover:shadow-sm active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {exporting ? "내보내는 중..." : "PDF 내보내기"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          통계를 불러오지 못했습니다: {error}
        </div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200/60 rounded-xl p-4 h-24 animate-pulse"
                >
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-200/60 rounded-xl p-4 h-72 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 bg-slate-100 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200/60 rounded-xl p-4 h-[420px] animate-pulse">
            <div className="h-3 bg-slate-100 rounded w-1/3 mb-4" />
          </div>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
          <div className="space-y-3">
            <KpiCards rooms={data.rooms} periodLabel={PERIOD_SUB[query.mode]} />
            <RoomUsageChart rooms={data.rooms} />
          </div>
          <WeeklyHeatmap cells={data.heatmap} title={HEATMAP_TITLE[query.mode]} />
        </div>
      )}
    </div>
  );
}
