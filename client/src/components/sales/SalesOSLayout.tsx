import { useLocation, Link } from "wouter";
import { ListChecks, MessageSquare, BarChart3, ChevronLeft, Globe, Bell, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SalesOSLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t, language, setLanguage } = useI18n();

  const NAV = [
    { path: "/sales-os/queue", icon: ListChecks, label: t("salesos.nav.queue") },
    { path: "/sales-os/replies", icon: MessageSquare, label: t("salesos.nav.replies"), badge: 3 },
    { path: "/sales-os/manager", icon: BarChart3, label: t("salesos.nav.manager") },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8F9FC", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col py-5 px-3 border-r shrink-0 z-20"
        style={{ width: 220, background: "#FFFFFF", borderColor: "#E8EAED", boxShadow: "1px 0 0 #E8EAED" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)" }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>OS</span>
          </div>
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

        {/* Nav */}
        <div className="space-y-0.5 flex-1">
          {NAV.map(({ path, icon: Icon, label, badge }) => {
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
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all mb-1"
          style={{ color: "#9CA3AF" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FC")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <Globe size={14} />
          <span>{t("salesos.nav.lang_toggle")}</span>
        </button>

        {/* Rep avatar */}
        <div className="flex items-center gap-2.5 px-2 pt-3 border-t" style={{ borderColor: "#E8EAED" }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)", color: "#fff" }}
          >
            R
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "#16163f" }}>Renan</div>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full inline-block font-medium"
              style={{ background: "rgba(158,63,253,0.1)", color: "#9e3ffd" }}
            >
              Gerente
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
  );
}
