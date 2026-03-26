"use client";

import { useState } from "react";
import { MeetingRoom } from "@/lib/types";

type Props = {
  room: MeetingRoom;
  date: string;
  startTime: string;
  availableUntil: string;
  onClose: () => void;
  onBooked: () => void;
};

function parseKSTTime(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const hh = kst.getUTCHours().toString().padStart(2, "0");
  const mm = kst.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const newH = Math.min(h + 1, 23);
  return `${newH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function minTime(a: string, b: string): string {
  return a <= b ? a : b;
}

export default function BookingModal({
  room,
  date,
  startTime,
  availableUntil,
  onClose,
  onBooked,
}: Props) {
  const maxEnd = parseKSTTime(availableUntil);
  const defaultEnd = minTime(addHour(startTime), maxEnd);

  const [title, setTitle] = useState("");
  const [endTime, setEndTime] = useState(defaultEnd);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("회의 제목을 입력해 주세요.");
      return;
    }
    if (endTime <= startTime) {
      setError("종료 시간은 시작 시간 이후여야 합니다.");
      return;
    }
    if (endTime > maxEnd) {
      setError(`종료 시간은 ${maxEnd}을 초과할 수 없습니다.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          title: title.trim(),
          date,
          startTime,
          endTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "REAUTH_REQUIRED") {
          setError("권한이 부족합니다. 다시 로그인해 주세요.");
        } else if (data.error === "CONFLICT") {
          setError(data.message || "해당 시간에 이미 예약된 회의가 있습니다.");
        } else {
          setError(data.message || "예약에 실패했습니다. 다시 시도해 주세요.");
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onBooked();
        onClose();
      }, 1500);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200";

  const labelClass = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            회의실 예약
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>회의실</label>
            <p className="text-sm font-medium text-slate-900">
              {room.name}
              <span className="text-slate-400 font-normal ml-2">
                {room.floor} &middot; {room.capacity}명
              </span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>날짜</label>
              <p className="text-sm text-slate-900">{date}</p>
            </div>
            <div>
              <label className={labelClass}>시작</label>
              <p className="text-sm text-slate-900">{startTime}</p>
            </div>
            <div>
              <label htmlFor="endTime" className={labelClass}>
                종료
              </label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                min={startTime}
                max={maxEnd}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="title" className={labelClass}>
              회의 제목
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 주간 팀 미팅"
              className={inputClass}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-emerald-600 bg-emerald-50 rounded-md px-3 py-2">
              예약이 완료되었습니다.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className={
                "flex-1 px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 " +
                "hover:bg-indigo-700 transition-all duration-200 active:scale-[0.98] " +
                "disabled:opacity-60 disabled:cursor-not-allowed"
              }
            >
              {submitting ? "예약 중..." : "예약하기"}
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center">
            이 예약은 대시보드를 통해 생성되며, Google Calendar 회의실 시스템과 직접 연동되지 않습니다.
          </p>
        </form>
      </div>
    </div>
  );
}
