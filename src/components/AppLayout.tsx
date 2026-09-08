import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopNav from "./TopNav";

export default function AppLayout() {
  return (
    <div className="app-shell flex min-h-[100dvh] flex-col bg-warm-white text-ink">
      {/* Desktop header nav — hidden on mobile */}
      <div className="hidden md:block flex-shrink-0">
        <TopNav />
      </div>

      {/* Main content — scrollable, flex-1 fills remaining height */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
