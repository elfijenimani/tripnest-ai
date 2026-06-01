import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  onNewTrip?: () => void;
  onLogout?: () => void;
};

export function AppShell({ children, onNewTrip, onLogout }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 px-6 md:px-10 py-5 bg-background/80 backdrop-blur-xl border-b border-foreground/5">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-sunset" />
            <span className="font-display text-xl font-bold tracking-tight">
              TripNest AI
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">
            <span className="text-foreground border-b border-foreground pb-1">
              Dashboard
            </span>
            <a href="#trips" className="hover:text-foreground">
              Trips
            </a>
            <a href="#map" className="hover:text-foreground">
              Memory Map
            </a>
            <a href="#folders" className="hover:text-foreground">
              Folders
            </a>
            <a href="#ai" className="hover:text-foreground">
              AI Assistant
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {onNewTrip && (
              <button
                onClick={onNewTrip}
                className="px-5 py-2 bg-foreground text-background rounded-full text-xs font-medium uppercase tracking-widest hover:bg-sunset hover:text-foreground transition-all"
              >
                + New Trip
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-5 py-2 border border-foreground/10 rounded-full text-xs font-medium uppercase tracking-widest hover:bg-white transition-all"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 md:px-10 py-12">
        {children}
      </main>
    </div>
  );
}