import React, { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Layers,
  Film,
  PlaySquare,
  Wand2,
  Users,
  CreditCard,
  Coins,
  MessageSquare,
  UploadCloud,
  Bell,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Menu,
  X,
  Plus,
  Sparkles,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db, subscribeDb, resetStoreToSeed, hydrate } from "../lib/mock/db";
import ConfirmModal from "./admin/ConfirmModal";

type NavItem = {
  label: string;
  labelSw?: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    void hydrate().then(() => db.monetize.refreshAdmin().catch(() => undefined));
    const onFocus = () => {
      if (document.visibilityState && document.visibilityState !== "visible") return;
      void db.monetize.refreshAdmin().catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [user?.role]);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setQuickActionOpen(false);
  }, [location.pathname]);

  // Dynamic counts for badges
  const pendingCommunityCount = db.communityUploads.findMany({ status: "PENDING" }).length;
  const unreadNotifCount = db.notifications.findMany().filter((n) => !n.read).length;
  const renderingJobsCount = db.videoJobs.findMany().filter((j) => j.status === "RENDERING").length;

  const navGroups: NavGroup[] = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          path: "/admin",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          label: "Analytics & KPIs",
          path: "/admin/analytics",
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Content Management",
      items: [
        {
          label: "Categories",
          path: "/admin/categories",
          icon: <Layers className="h-4 w-4" />,
        },
        {
          label: "Series Catalog",
          path: "/admin/series",
          icon: <Film className="h-4 w-4" />,
        },
        {
          label: "Episodes Catalog",
          path: "/admin/episodes",
          icon: <PlaySquare className="h-4 w-4" />,
        },
        {
          label: "Content Rules Audit",
          path: "/admin/content-rules",
          icon: <ShieldCheck className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "AI & Video Studio",
      items: [
        {
          label: "AI Story Studio",
          path: "/admin/ai-studio",
          icon: <Sparkles className="h-4 w-4" />,
        },
        {
          label: "AI Video Jobs",
          path: "/admin/videos",
          icon: <Wand2 className="h-4 w-4" />,
          badge: renderingJobsCount > 0 ? renderingJobsCount : undefined,
        },
      ],
    },
    {
      title: "Community & Moderation",
      items: [
        {
          label: "Submissions",
          path: "/admin/community",
          icon: <UploadCloud className="h-4 w-4" />,
          badge: pendingCommunityCount > 0 ? pendingCommunityCount : undefined,
        },
        {
          label: "User Comments",
          path: "/admin/comments",
          icon: <MessageSquare className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Users & Monetization",
      items: [
        {
          label: "User Accounts",
          path: "/admin/users",
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: "Subscriptions & VIP",
          path: "/admin/subscriptions",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          label: "Unlocks & Sadaqah",
          path: "/admin/monetize",
          icon: <Coins className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "System & Broadcast",
      items: [
        {
          label: "Push Notifications",
          path: "/admin/notifications",
          icon: <Bell className="h-4 w-4" />,
          badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
        },
        {
          label: "System & Reset",
          path: "/admin/system",
          icon: <RotateCcw className="h-4 w-4" />,
        },
      ],
    },
  ];

  function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/series?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  function handleResetDb() {
    void resetStoreToSeed();
    setResetModalOpen(false);
  }

  return (
    <div className="h-screen bg-[#F8F9FA] text-ink flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-deep-green text-warm-white border-b border-white/10 sticky top-0 z-30 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg bg-white/10 text-warm-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/admin" className="font-display text-base font-bold tracking-tight text-warm-white flex items-center gap-1.5">
            <span className="text-gold">✦</span> Qisas Admin
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/home"
            className="text-[11px] font-bold text-gold-light hover:text-white flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-lg"
          >
            <span>App</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Sticky Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-deep-green text-warm-white flex flex-col transition-transform duration-200 ease-in-out border-r border-white/10 shadow-xl
          md:relative md:translate-x-0 md:w-64 md:flex-shrink-0 md:h-screen md:sticky md:top-0 md:shadow-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Header */}
        <div className="p-4.5 border-b border-white/10 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-inner font-serif font-black text-lg">
              ق
            </div>
            <div>
              <div className="font-display text-sm font-extrabold tracking-tight text-warm-white">
                Qisas Portal
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-gold-light">
                Enterprise Admin
              </div>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-warm-white/70 hover:text-warm-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live status badge */}
        <div className="px-4.5 py-2.5 bg-black/20 border-b border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-warm-white/80 font-medium">Production Node</span>
          </div>
          <span className="text-[10px] font-mono text-gold-light bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20">
            v2.1
          </span>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-warm-white/40">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isExact = item.path === "/admin";
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={isExact}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-2 rounded-xl text-[12px] font-medium transition-all ${
                          isActive
                            ? "bg-gold text-deep-green font-bold shadow-sm"
                            : "text-warm-white/80 hover:bg-white/10 hover:text-warm-white"
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {typeof item.badge === "number" && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Info & Quick Action Footer */}
        <div className="p-3 border-t border-white/10 bg-black/20 space-y-2">
          <div className="flex items-center justify-between px-2 text-[12px]">
            <div className="truncate pr-2">
              <div className="font-bold text-warm-white truncate text-[11px]">{user?.name || "Admin"}</div>
              <div className="text-[10px] text-warm-white/50 truncate">{user?.email || "admin@qisas.local"}</div>
            </div>
            <Link
              to="/home"
              className="p-1.5 rounded-lg bg-white/10 text-gold-light hover:bg-white/20 hover:text-white transition"
              title="Open viewer app"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => setResetModalOpen(true)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-warm-white/70 hover:text-warm-white transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[10px] font-bold text-red-200 transition cursor-pointer"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-line shadow-xs flex-shrink-0">
          {/* Quick Search */}
          <form onSubmit={handleQuickSearch} className="relative w-80">
            <Search className="absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search series, episodes, users..."
              className="w-full rounded-xl border border-line bg-sand/30 pl-9 pr-3 py-1.5 text-[12px] placeholder:text-muted focus:bg-white focus:border-gold focus:outline-none transition"
            />
          </form>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              target="_blank"
              className="flex items-center gap-1.5 text-[11px] font-bold text-deep-green border border-line px-3 py-1.5 rounded-xl hover:bg-sand/30 transition shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted" />
              <span>Viewer App</span>
            </Link>

            {/* Quick Action Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setQuickActionOpen(!quickActionOpen)}
                className="flex items-center gap-1.5 bg-deep-green hover:bg-teal text-warm-white text-[12px] font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-gold-light" />
                <span>Quick Create</span>
              </button>

              {quickActionOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-line shadow-xl py-1.5 z-50 text-[12px]"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <Link
                    to="/admin/series/new"
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-sand/40 font-semibold text-ink transition"
                  >
                    <Film className="h-3.5 w-3.5 text-deep-green" />
                    <span>New Series</span>
                  </Link>
                  <Link
                    to="/admin/episodes/new"
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-sand/40 font-semibold text-ink transition"
                  >
                    <PlaySquare className="h-3.5 w-3.5 text-deep-green" />
                    <span>Upload Episode</span>
                  </Link>
                  <Link
                    to="/admin/categories/new"
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-sand/40 font-semibold text-ink transition"
                  >
                    <Layers className="h-3.5 w-3.5 text-deep-green" />
                    <span>New Category</span>
                  </Link>
                  <Link
                    to="/admin/videos/new"
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-sand/40 font-semibold text-ink transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-gold" />
                    <span>AI Video Generator</span>
                  </Link>
                  <div className="my-1 border-t border-line" />
                  <Link
                    to="/admin/notifications"
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-sand/40 font-semibold text-ink transition"
                  >
                    <Bell className="h-3.5 w-3.5 text-teal" />
                    <span>Broadcast Notification</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Reset Seed Database Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        title="Reset Mock Database to Seed?"
        message="This will restore all default categories, prophet stories, adab etiquette, seed users, and demo subscriptions. Custom admin edits will be re-seeded."
        confirmLabel="Yes, Reset Database"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleResetDb}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
}
