import { useState, createContext, useContext } from "react";
import { useLocation, Link } from "wouter";
import { ListChecks, MessageSquare, BarChart3, GraduationCap, TrendingUp, ChevronLeft, Globe, Bell, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import logoIcon from "@/assets/branding/logo-icon-transparent.png";

// ── ViewAs context — lets any child know who we're previewing as ──────────────
type ViewAsUser = "Renan" | "Elayne" | "Thaina";

interface ViewAsCtx {
  viewAs: ViewAsUser;
  setViewAs: (v: ViewAsUser) => void;
  isRep: boolean;
}

const ViewAsContext = createContext<ViewAsCtx>({
  viewAs: "Renan",
  setViewAs: () => {},
  isRep: false,
});

export function useViewAs() {
  return useContext(ViewAsContext);
}

const USERS: { name: ViewAsUser; initial: string; role: string; isRep: boolean }[] = [
  { name: "Renan",  initial: "R", role: "Gerente",  isRep: false },
  { name: "Elayne", initial: "E", role: "SDR",      isRep: true  },
  { name: "Thaina", initial: "T", role: "SDR",      isRep: true  },
];

// Module-level singleton — persists viewAs across SalesOSLayout unmount/remount on page navigation
let _globalViewAs: ViewAsUser = "Renan";

export function SalesOSLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t, language, setLanguage } = useI18n();
  const [viewAs, _rawSetViewAs] = useState<ViewAsUser>(_globalViewAs);
  const [pickerOpen, setPickerOpen] = useState(false);

  const setViewAs = (v: ViewAsUser) => {
    _globalViewAs = v;
    _rawSetViewAs(v);
  };

  const currentUser = USERS.find(u => u.name === viewAs) ?? USERS[0];
  const isRep = currentUser.isRep;

  const ALL_NAV = [
    { path: "/sales-os/queue",       icon: ListChecks,    label: t("salesos.nav.queue") },
    { path: "/sales-os/replies",     icon: MessageSquare, label: t("salesos.nav.replies"), badge: 3 },
    { path: "/sales-os/manager",     icon: BarChart3,     label: isRep ? "Meu Painel" : t("salesos.nav.manager") },
    { path: "/sales-os/coaching",    icon: GraduationCap, label: "Coaching" },
    ...(isRep ? [{ path: "/sales-os/performance", icon: TrendingUp, label: "Meu Desempenho" }] : []),
  ];

  const visibleNav = ALL_NAV;

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, isRep }}>
      <div className="flex h-screen overflow-hidden" style={{ background: "#F8F9FC", fontFamily: "'Inter', sans-serif" }}>
        {/* Sidebar */}
        <aside
          className="flex flex-col py-5 px-3 border-r shrink-0 z-20"
          style={{ width: 220, background: "#FFFFFF", borderColor: "#E8EAED", boxShadow: "1px 0 0 #E8EAED" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 mb-6">
            <img src={logoIcon} alt="Ótima" className="w-8 h-8 object-contain shrink-0" />
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: "#16163f" }}>Ótima</div>
              <div className="text-[10px] font-medium" style={{ color: "#9CA3AF" }}>Sales OS</div>
            </div>
          </div>

          {/* Back to portal */}
          <Link href="/admin/deals">
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-3 cursor-pointer transition-colors text-sm"
              style={{ color: "#9CA3AF" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FC")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <ChevronLeft size={14} />
              <span>{t("salesos.nav.back")}</span>
            </div>
          </Link>

          {/* Nav — Manager hidden for reps */}
          <div className="space-y-0.5 flex-1">
            {visibleNav.map(({ path, icon: Icon, label, badge }) => {
              const active = location === path || location.startsWith(path.replace("/queue", "/leads"));
              return (
                <Link key={path} href={path}>
                  <div
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all relative"
                    style={{
                      background: active ? "rgba(158,63,253,0.07)" : "transparent",
                      color: active ? "#9e3ffd" : "#6B7280",
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8F9FC"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    {active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                        style={{ width: 3, height: 20, background: "#9e3ffd" }}
                      />
                    )}
                    <Icon size={16} />
                    <span className="text-sm font-medium flex-1">{label}</span>
                    {badge !== undefined && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#ef4444", color: "#fff", minWidth: 18, textAlign: "center" }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all mb-2"
            style={{ color: "#9CA3AF" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FC")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Globe size={14} />
            <span>{t("salesos.nav.lang_toggle")}</span>
          </button>

          {/* Role switcher — prototype only */}
          {!isRep && <div className="px-2 pb-3 border-b mb-3" style={{ borderColor: "#E8EAED" }}>
            <div
              className="text-[9px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "#C4B8D0" }}
            >
              Ver como
            </div>
            <div className="relative">
              <button
                onClick={() => setPickerOpen(p => !p)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: "#F8F9FC",
                  border: "1px solid #E8EAED",
                  color: "#374151",
                }}
              >
                {/* Avatar */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{
                    background: isRep
                      ? "linear-gradient(135deg,#3b82f6,#06b6d4)"
                      : "linear-gradient(135deg,#9e3ffd,#df0af2)",
                    color: "#fff",
                  }}
                >
                  {currentUser.initial}
                </div>
                <span className="flex-1 text-left">{currentUser.name}</span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: isRep ? "rgba(59,130,246,0.1)" : "rgba(158,63,253,0.1)",
                    color: isRep ? "#3b82f6" : "#9e3ffd",
                  }}
                >
                  {currentUser.role}
                </span>
                <ChevronDown size={11} style={{ color: "#9CA3AF" }} />
              </button>

              {pickerOpen && (
                <div
                  className="absolute bottom-full left-0 right-0 mb-1 rounded-lg overflow-hidden"
                  style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 100 }}
                >
                  {USERS.map(u => (
                    <button
                      key={u.name}
                      onClick={() => { setViewAs(u.name); setPickerOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all"
                      style={{
                        background: viewAs === u.name ? "rgba(158,63,253,0.06)" : "transparent",
                        color: viewAs === u.name ? "#9e3ffd" : "#374151",
                      }}
                      onMouseEnter={e => { if (viewAs !== u.name) e.currentTarget.style.background = "#F8F9FC"; }}
                      onMouseLeave={e => { if (viewAs !== u.name) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                        style={{
                          background: u.isRep
                            ? "linear-gradient(135deg,#3b82f6,#06b6d4)"
                            : "linear-gradient(135deg,#9e3ffd,#df0af2)",
                          color: "#fff",
                        }}
                      >
                        {u.initial}
                      </div>
                      <span className="font-medium flex-1 text-left">{u.name}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: u.isRep ? "rgba(59,130,246,0.1)" : "rgba(158,63,253,0.1)",
                          color: u.isRep ? "#3b82f6" : "#9e3ffd",
                        }}
                      >
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>}

          {/* Rep avatar (mirrors the switcher selection) */}
          <div className="flex items-center gap-2.5 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                background: isRep
                  ? "linear-gradient(135deg,#3b82f6,#06b6d4)"
                  : "linear-gradient(135deg,#9e3ffd,#df0af2)",
                color: "#fff",
              }}
            >
              {currentUser.initial}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "#16163f" }}>{currentUser.name}</div>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full inline-block font-medium"
                style={{
                  background: isRep ? "rgba(59,130,246,0.1)" : "rgba(158,63,253,0.1)",
                  color: isRep ? "#3b82f6" : "#9e3ffd",
                }}
              >
                {currentUser.role}
              </span>
            </div>
            <div className="ml-auto relative">
              <Bell size={14} style={{ color: "#9CA3AF" }} />
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                3
              </span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto" style={{ background: "#F8F9FC" }}>
          {children}
        </main>
      </div>
    </ViewAsContext.Provider>
  );
}
