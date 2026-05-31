import { useLocation, Link } from "wouter";
import { PhoneCall, ListChecks, MessageSquare, BarChart3, ChevronLeft } from "lucide-react";

const NAV = [
  { path: "/sales-os/queue", icon: ListChecks, label: "Fila" },
  { path: "/sales-os/dialer", icon: PhoneCall, label: "Discador" },
  { path: "/sales-os/replies", icon: MessageSquare, label: "Respostas" },
  { path: "/sales-os/manager", icon: BarChart3, label: "Gerente" },
];

export function SalesOSLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#16163f", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar icon rail */}
      <aside className="flex flex-col items-center py-4 gap-1 border-r shrink-0 z-20" style={{ width: 60, background: "#0f0e2a", borderColor: "rgba(255,255,255,0.07)" }}>
        {/* Back to portal */}
        <Link href="/admin/deals">
          <div className="flex items-center justify-center rounded-lg mb-4 transition-colors cursor-pointer" style={{ width: 40, height: 40, color: "rgba(255,255,255,0.35)" }} title="Voltar ao Portal">
            <ChevronLeft size={18} />
          </div>
        </Link>

        {/* Logo pip */}
        <div className="w-7 h-7 rounded-full mb-3 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9e3ffd,#df0af2)" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>OS</span>
        </div>

        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location === path || location.startsWith(path.replace("/queue", "/leads"));
          return (
            <Link key={path} href={path}>
              <div
                className="flex flex-col items-center justify-center rounded-lg transition-all gap-0.5 relative cursor-pointer"
                style={{
                  width: 48, height: 48,
                  color: active ? "#9e3ffd" : "rgba(255,255,255,0.4)",
                  background: active ? "rgba(158,63,253,0.15)" : "transparent",
                }}
                title={label}
              >
                <Icon size={20} />
                <span style={{ fontSize: 9 }}>{label}</span>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r" style={{ background: "#9e3ffd" }} />}
              </div>
            </Link>
          );
        })}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
