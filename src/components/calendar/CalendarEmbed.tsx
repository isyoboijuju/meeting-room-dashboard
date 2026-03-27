"use client";

const CALENDAR_ID = "c_3csipio0le728mjl6gdgo8j3e4@group.calendar.google.com";
const GOOGLE_CALENDAR_URL = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(CALENDAR_ID)}`;

export default function CalendarEmbed() {
  const src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&ctz=Asia/Seoul&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0`;

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="relative w-full h-[calc(100vh-190px)] overflow-hidden">
        <iframe
          src={src}
          className="w-full border-0"
          style={{ height: "calc(100% + 36px)" }}
          title="Google Calendar"
        />
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50">
        <a
          href={GOOGLE_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          Google Calendar로 바로가기 ↗
        </a>
        <span className="text-xs text-slate-400">Google Calendar</span>
      </div>
    </div>
  );
}
