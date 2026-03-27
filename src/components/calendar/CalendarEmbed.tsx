"use client";

const CALENDAR_ID = "c_3csipio0le728mjl6gdgo8j3e4@group.calendar.google.com";

export default function CalendarEmbed() {
  const src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&ctz=Asia/Seoul&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0`;

  return (
    <div className="w-full h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <iframe
        src={src}
        className="w-full h-full border-0"
        title="Google Calendar"
      />
    </div>
  );
}
