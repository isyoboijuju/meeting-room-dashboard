"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
      <h1 className="text-xl font-bold text-neutral-900 tracking-tight">DSRV Meeting Rooms</h1>
      <div className="flex items-center gap-4">
        {session ? (
          <>
            <span className="text-sm text-neutral-500">{session.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="text-sm px-4 py-2 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
