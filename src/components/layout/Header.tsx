"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const sessionError = (session as any)?.error;

  async function handleReauth() {
    await signOut({ redirect: false });
    await signIn("google");
  }

  return (
    <>
      {sessionError === "RefreshTokenError" && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            인증이 만료되었습니다. 다시 로그인해 주세요.
          </p>
          <button
            onClick={handleReauth}
            className="text-sm px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors duration-200"
          >
            다시 로그인
          </button>
        </div>
      )}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">DSRV 회의실</h1>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-slate-500">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-200 active:scale-[0.98]"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="text-sm px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 active:scale-[0.98]"
            >
              Google로 로그인
            </button>
          )}
        </div>
      </header>
    </>
  );
}
