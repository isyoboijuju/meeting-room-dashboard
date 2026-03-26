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

  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const roomRows = report.rooms
    .map(
      (room: any) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${room.name ?? room.roomId}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${room.weeklyOccupancy}%</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${room.totalBookings}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${room.avgDurationMinutes}m</td>
      </tr>`
    )
    .join("");

  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;width:800px;padding:40px;font-family:system-ui,-apple-system,sans-serif;background:white;color:#1e293b;";
  container.innerHTML = `
    <h1 style="text-align:center;font-size:24px;font-weight:bold;margin:0 0 4px;">DSRV 회의실 리포트</h1>
    <p style="text-align:center;color:#64748b;font-size:14px;margin:0 0 24px;">기간: ${report.month}</p>
    <h2 style="font-size:16px;font-weight:bold;margin:0 0 8px;">요약</h2>
    <p style="font-size:14px;margin:0 0 4px;">총 예약 수: ${report.totalBookings}</p>
    <p style="font-size:14px;margin:0 0 20px;">평균 소요 시간: ${report.avgDuration}분</p>
    <h2 style="font-size:16px;font-weight:bold;margin:0 0 8px;">회의실별 통계</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px 12px;text-align:left;font-weight:600;">회의실</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;">사용률</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;">예약 수</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;">평균 시간</th>
        </tr>
      </thead>
      <tbody>${roomRows}</tbody>
    </table>
  `;
  document.body.appendChild(container);

  const canvas = await html2canvas(container, { scale: 2 });
  document.body.removeChild(container);

  const imgData = canvas.toDataURL("image/png");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const imgW = pageW - 20;
  const imgH = (canvas.height * imgW) / canvas.width;
  doc.addImage(imgData, "PNG", 10, 10, imgW, imgH);
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
          <WeeklyHeatmap cells={data.heatmap} title={HEATMAP_TITLE[query.mode]} weekStartDate={query.mode === "week" ? data.meta?.startDate : undefined} />
        </div>
      )}
    </div>
  );
}
