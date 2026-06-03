import { useState, createContext, useContext } from "react";
import { useLocation, Link } from "wouter";
import {
  ListChecks, MessageSquare, BarChart3, GraduationCap, TrendingUp,
  ChevronLeft, Globe, Bell, ChevronDown, ChevronRight, Heart, Target, GitBranch, Eye,
  DollarSign, LineChart, Compass, Lightbulb, Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import logoIcon from "@/assets/branding/logo-icon-transparent.png";

// ── ViewAs context ─────────────────────────────────────────────────────────
type ViewAsUser = "Callum" | "Renan" | "Elayne" | "Thaina" | "Oscar";

interface ViewAsCtx {
  viewAs: ViewAsUser;
  setViewAs: (v: ViewAsUser) => void;
  isRep: boolean;
  isParceiro: boolean;
  isFounder: boolean;
}

const ViewAsContext = createContext<ViewAsCtx>({
  viewAs: "Renan",
  setViewAs: () => {},
  isRep: false,
  isParceiro: false,
  isFounder: false,
});

export function useViewAs() {
  return useContext(ViewAsContext);
}

const USERS: { name: ViewAsUser; initial: string; role: string; isRep: boolean; isParceiro: boolean }[] = [
  { name: "Callum", initial: "C", role: "Fundador", isRep: false, isParceiro: false },
  { name: "Renan",  initial: "R", role: "Gerente",  isRep: false, isParceiro: false },
  { name: "Elayne", initial: "E", role: "SDR",      isRep: true,  isParceiro: false },
  { name: "Thaina", initial: "T", role: "SDR",      isRep: true,  isParceiro: false },
  { name: "Oscar",  initial: "O", role: "Parceiro", isRep: false, isParceiro: true  },
];

// Module-level singletons — persist across SalesOSLayout remounts
let _globalViewAs: ViewAsUser = "Renan";
let _globalMirroredByFounder = false;

// Founder nav — all items grouped by section (English only)
const FOUNDER_NAV_SECTIONS: { label: string; items: { path: string; icon: React.ElementType; label: string; badge?: number }[] }[] = [
  {
    label: "SALES",
    items: [
      { path: "/sales-os/queue",       icon: ListChecks,    label: "Queue" },
      { path: "/sales-os/replies",     icon: MessageSquare, label: "Replies", badge: 3 },
      { path: "/sales-os/performance", icon: TrendingUp,    label: "My Performance" },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { path: "/sales-os/manager",  icon: BarChart3,     label: "Manager Console" },
      { path: "/sales-os/coaching", icon: GraduationCap, label: "Coaching" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { path: "/sales-os/health", icon: Heart, label: "Health" },
    ],
  },
  {
    label: "PARTNERS",
    items: [
      { path: "/sales-os/oscar/targets",  icon: Target,    label: "My Targets" },
      { path: "/sales-os/oscar/pipeline", icon: GitBranch, label: "Agent Pipeline" },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { path: "/sales-os/finance/receita",  icon: DollarSign, label: "Revenue" },
      { path: "/sales-os/finance/pl",       icon: LineChart,  label: "P&L" },
      { path: "/sales-os/finance/previsao", icon: Compass,    label: "Forecast" },
      { path: "/sales-os/finance/decisoes", icon: Lightbulb,  label: "Decisions" },
    ],
  },
];

function getGradient(u: typeof USERS[0]) {
  if (u.name === "Callum") return "linear-gradient(135deg,#f59e0b,#d97706)";
  if (u.isRep)    return "linear-gradient(135deg,#3b82f6,#06b6d4)";
  if (u.isParceiro) return "linear-gradient(135deg,#16a34a,#059669)";
  return "linear-gradient(135deg,#9e3ffd,#df0af2)";
}
function getRoleColor(u: typeof USERS[0]) {
  if (u.name === "Callum") return "#d97706";
  if (u.isRep)    return "#3b82f6";
  if (u.isParceiro) return "#16a34a";
  return "#9e3ffd";
}
function getRoleBg(u: typeof USERS[0]) {
  if (u.name === "Callum") return "rgba(217,119,6,0.1)";
  if (u.isRep)    return "rgba(59,130,246,0.1)";
  if (u.isParceiro) return "rgba(22,163,74,0.1)";
  return "rgba(158,63,253,0.1)";
}

export function SalesOSLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { t, language, setLanguage } = useI18n();
  const [viewAs, _rawSetViewAs] = useState<ViewAsUser>(_globalViewAs);
  const [mirroredByFounder, _rawSetMirrored] = useState(_globalMirroredByFounder);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [otherViewsOpen, setOtherViewsOpen] = useState(false);

  const setViewAs = (v: ViewAsUser) => {
    _globalViewAs = v;
    _rawSetViewAs(v);
  };

  const currentUser = USERS.find(u => u.name === viewAs) ?? USERS[1];
  const isRep      = currentUser.isRep;
  const isParceiro = currentUser.isParceiro;
  const isFounder  = viewAs === "Callum";

  const avatarGradient = getGradient(currentUser);
  const roleColor      = getRoleColor(currentUser);
  const roleBg         = getRoleBg(currentUser);

  // Oscar's nav
  const OSCAR_NAV = [
    { path: "/sales-os/oscar/targets",  icon: Target,    label: "Meus Alvos" },
    { path: "/sales-os/oscar/pipeline", icon: GitBranch, label: "Pipeline de Agentes" },
  ] as const;

  // Main team nav
  const MAIN_NAV = [
    { path: "/sales-os/queue",       icon: ListChecks,    label: t("salesos.nav.queue"),                badge: undefined },
    { path: "/sales-os/replies",     icon: MessageSquare, label: t("salesos.nav.replies"),              badge: 3 as number | undefined },
    { path: "/sales-os/manager",     icon: BarChart3,     label: isRep ? "Meu Painel" : "Console do Gerente", badge: undefined },
    { path: "/sales-os/coaching",    icon: GraduationCap, label: "Coaching",                           badge: undefined },
    ...(!isRep ? [{ path: "/sales-os/health", icon: Heart, label: "Saúde", badge: undefined }] : []),
    { path: "/sales-os/performance", icon: TrendingUp,    label: "Meu Desempenho",                     badge: undefined },
  ];

  function isActive(path: string) {
    if (location === path) return true;
    if (path === "/sales-os/queue" && location.startsWith("/sales-os/leads")) return true;
    if (path === "/sales-os/oscar/targets" && location.startsWith("/sales-os/oscar/leads")) return true;
    return false;
  }

  function handlePickUser(u: typeof USERS[0]) {
    const wasPartner = currentUser.isParceiro;
    const wasFounder = currentUser.name === "Callum";

    // Track when founder is mirroring another role
    _globalMirroredByFounder = wasFounder && u.name !== "Callum";
    _rawSetMirrored(_globalMirroredByFounder);

    setViewAs(u.name);
    setPickerOpen(false);

    if (u.name === "Callum") {
      navigate("/sales-os/health");
    } else if (u.isParceiro) {
      navigate("/sales-os/oscar/targets");
    } else if (wasPartner || wasFounder) {
      navigate("/sales-os/queue");
    }
  }

  const sidebarSubtitle = isFounder ? "Founder OS" : isParceiro ? "Portal Agente" : "Sales OS";
  // VER COMO shows for manager (Renan) only — Callum uses the "Other Views" sidebar dropdown instead
  const showVerComo = (!isRep && !isParceiro && !isFounder) || mirroredByFounder;
  const OTHER_VIEW_USERS = USERS.filter(u => u.name !== "Callum");

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, isRep, isParceiro, isFounder }}>
      <div className="flex h-screen overflow-hidden" style={{ background: "#F8F9FC", fontFamily: "'Inter', sans-serif" }}>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside
          className="flex flex-col py-5 px-3 border-r shrink-0 z-20"
          style={{ width: 220, background: "#FFFFFF", borderColor: "#E8EAED", boxShadow: "1px 0 0 #E8EAED" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 mb-6">
            <img src={logoIcon} alt="Ótima" className="w-8 h-8 object-contain shrink-0" />
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: "#16163f" }}>Ótima</div>
              <div className="text-[10px] font-medium" style={{ color: "#9CA3AF" }}>{sidebarSubtitle}</div>
            </div>
          </div>

          {/* Back to portal */}
          {!isParceiro && (
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
          )}

          {/* Nav — grouped for Callum, flat for everyone else */}
          <div className="flex-1 overflow-y-auto">
            {isFounder ? (
              <div className="space-y-3">
                {FOUNDER_NAV_SECTIONS.map(section => (
                  <div key={section.label}>
                    <div className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: "#C4C8D4" }}>
                      {section.label}
                    </div>
                    <div className="space-y-0.5">
                      {section.items.map(({ path, icon: Icon, label, badge }) => {
                        const active = isActive(path);
                        return (
                          <Link key={path} href={path}>
                            <div
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all relative"
                              style={{ background: active ? "rgba(217,119,6,0.08)" : "transparent", color: active ? "#d97706" : "#6B7280" }}
                              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8F9FC"; }}
                              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                            >
                              {active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                                  style={{ width: 3, height: 20, background: "#d97706" }} />
                              )}
                              <Icon size={16} />
                              <span className="text-sm font-medium flex-1">{label}</span>
                              {badge !== undefined && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: "#ef4444", color: "#fff", minWidth: 18, textAlign: "center" }}>
                                  {badge}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* ── Other Views collapsible ─────────────────────────── */}
                <div>
                  <div className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: "#C4C8D4" }}>
                    Other Views
                  </div>
                  <button
                    onClick={() => setOtherViewsOpen(o => !o)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <Users size={16} />
                    <span className="text-sm font-medium flex-1 text-left">Team</span>
                    {otherViewsOpen
                      ? <ChevronDown size={13} style={{ color: "#C4C8D4" }} />
                      : <ChevronRight size={13} style={{ color: "#C4C8D4" }} />}
                  </button>

                  {otherViewsOpen && (
                    <div className="mt-0.5 ml-3 pl-3 space-y-0.5" style={{ borderLeft: "2px solid #F0F0F5" }}>
                      {OTHER_VIEW_USERS.map(u => (
                        <button
                          key={u.name}
                          onClick={() => handlePickUser(u)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all"
                          style={{ color: "#6B7280" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FC")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                            style={{ background: getGradient(u), color: "#fff" }}
                          >
                            {u.initial}
                          </div>
                          <span className="font-medium flex-1 text-left">{u.name}</span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: getRoleBg(u), color: getRoleColor(u) }}
                          >
                            {u.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                {(isParceiro ? OSCAR_NAV : MAIN_NAV).map(({ path, icon: Icon, label, badge }) => {
                  const active = isActive(path);
                  return (
                    <Link key={path} href={path}>
                      <div
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all relative"
                        style={{ background: active ? "rgba(158,63,253,0.07)" : "transparent", color: active ? "#9e3ffd" : "#6B7280" }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8F9FC"; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                      >
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                            style={{ width: 3, height: 20, background: "#9e3ffd" }} />
                        )}
                        <Icon size={16} />
                        <span className="text-sm font-medium flex-1">{label}</span>
                        {badge !== undefined && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "#ef4444", color: "#fff", minWidth: 18, textAlign: "center" }}>
                            {badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all mb-2 mt-3"
            style={{ color: "#9CA3AF" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FC")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Globe size={14} />
            <span>{t("salesos.nav.lang_toggle")}</span>
          </button>

          {/* VER COMO — visible to manager, founder, and when founder is mirroring */}
          {showVerComo && (
            <div className="px-2 pb-3 border-b mb-3" style={{ borderColor: "#E8EAED" }}>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#C4B8D0" }}>
                Ver como
              </div>
              <div className="relative">
                <button
                  onClick={() => setPickerOpen(p => !p)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "#F8F9FC", border: "1px solid #E8EAED", color: "#374151" }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: avatarGradient, color: "#fff" }}>
                    {currentUser.initial}
                  </div>
                  <span className="flex-1 text-left">{currentUser.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: roleBg, color: roleColor }}>
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
                        onClick={() => handlePickUser(u)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all"
                        style={{
                          background: viewAs === u.name ? "rgba(158,63,253,0.06)" : "transparent",
                          color: viewAs === u.name ? "#9e3ffd" : "#374151",
                        }}
                        onMouseEnter={e => { if (viewAs !== u.name) e.currentTarget.style.background = "#F8F9FC"; }}
                        onMouseLeave={e => { if (viewAs !== u.name) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{ background: getGradient(u), color: "#fff" }}>
                          {u.initial}
                        </div>
                        <span className="font-medium flex-1 text-left">{u.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: getRoleBg(u), color: getRoleColor(u) }}>
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User avatar footer */}
          <div className="flex items-center gap-2.5 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: avatarGradient, color: "#fff" }}
            >
              {currentUser.initial}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "#16163f" }}>{currentUser.name}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full inline-block font-medium"
                style={{ background: roleBg, color: roleColor }}>
                {currentUser.role}
              </span>
            </div>
            {!isParceiro && (
              <div className="ml-auto relative">
                <Bell size={14} style={{ color: "#9CA3AF" }} />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: "#ef4444", color: "#fff" }}>
                  3
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto relative" style={{ background: "#F8F9FC" }}>
          {/* Founder mirror badge */}
          {mirroredByFounder && (
            <div
              className="fixed flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                top: 14, right: 14, zIndex: 200,
                background: "#fffbeb", color: "#d97706",
                border: "1px solid #fde68a",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              }}
            >
              <Eye size={11} />
              Visualizando como: {currentUser.name}
              <button
                onClick={() => handlePickUser(USERS.find(u => u.name === "Callum")!)}
                className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: "rgba(217,119,6,0.2)", color: "#d97706" }}
              >
                ✕
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </ViewAsContext.Provider>
  );
}
