"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight">DSRV Meeting Rooms</h1>
      <div className="flex items-center gap-4">
        {session ? (
          <>
            <span className="text-sm text-slate-500">{session.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-200 active:scale-[0.98]"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="text-sm px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 active:scale-[0.98]"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
