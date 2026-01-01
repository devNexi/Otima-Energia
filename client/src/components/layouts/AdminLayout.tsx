import { useAuth, UserRole } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  Users,
  Briefcase,
  LayoutDashboard,
  FileText,
  DollarSign,
  Shield,
  Settings,
  LogOut,
  Building2,
  Zap,
  Send,
  Link2
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: string;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useI18n();
  const [location] = useLocation();

  const mainNavItems: NavItem[] = [
    { label: "Fornecedores", href: "/admin/suppliers", icon: <Building2 className="w-4 h-4" />, roles: ['admin', 'ops', 'sales'] },
    { label: "Negócios", href: "/admin/deals", icon: <Briefcase className="w-4 h-4" />, roles: ['admin', 'ops', 'sales'] },
    { label: "ECOS", href: "/admin/ecos", icon: <Zap className="w-4 h-4" />, roles: ['admin', 'ops', 'sales'] },
    { label: "RFQs / Cotações", href: "/admin/rfqs", icon: <Send className="w-4 h-4" />, roles: ['admin', 'ops', 'sales'] },
    { label: "Ops Dashboard", href: "/admin/ops-dashboard", icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin', 'ops'] },
    { label: "Clientes", href: "/admin/clients", icon: <Users className="w-4 h-4" />, roles: ['admin', 'ops', 'sales'] },
    { label: "Comissão", href: "/admin/commission", icon: <DollarSign className="w-4 h-4" />, roles: ['admin', 'ops', 'sales'] },
  ];

  const adminNavItems: NavItem[] = [
    { label: "Visão Geral", href: "/admin/overview", icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin'] },
    { label: "Auditoria", href: "/admin/audit", icon: <FileText className="w-4 h-4" />, roles: ['admin'] },
    { label: "Integrações", href: "/admin/integrations", icon: <Link2 className="w-4 h-4" />, roles: ['admin'] },
    { label: "Configurações", href: "/admin/settings", icon: <Settings className="w-4 h-4" />, roles: ['admin'] },
  ];

  const filteredMainNav = mainNavItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const filteredAdminNav = adminNavItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (location === href) return true;
    if (href !== '/admin/deals' && href !== '/admin/overview' && location.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/admin/deals">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Ótima OS</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMainNav.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-')}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </Link>
          ))}

          {filteredAdminNav.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  <span>Admin</span>
                </div>
              </div>
              {filteredAdminNav.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="truncate">{user?.username}</span>
            <Badge variant="outline" className="ml-auto text-xs capitalize">
              {user?.role}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
