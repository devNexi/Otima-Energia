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
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
  roles: UserRole[];
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['sales', 'office', 'admin']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const navSections: NavSection[] = [
    {
      title: "Vendas",
      icon: <Briefcase className="w-4 h-4" />,
      roles: ['admin', 'sales'],
      items: [
        { label: "Dashboard", href: "/admin/sales", icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin', 'sales'] },
        { label: "ECOS", href: "/admin/sales/ecos", icon: <Zap className="w-4 h-4" />, roles: ['admin', 'sales'] },
        { label: "Leads", href: "/admin/sales/leads", icon: <Users className="w-4 h-4" />, roles: ['admin', 'sales'] },
        { label: "Clientes", href: "/admin/sales/clients", icon: <Building2 className="w-4 h-4" />, roles: ['admin', 'sales'] },
        { label: "Meus Negócios", href: "/admin/sales/deals", icon: <FileText className="w-4 h-4" />, roles: ['admin', 'sales'] },
      ]
    },
    {
      title: "Operações",
      icon: <Settings className="w-4 h-4" />,
      roles: ['admin', 'ops'],
      items: [
        { label: "Dashboard Ops", href: "/admin/ops", icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin', 'ops'] },
        { label: "Negócios", href: "/admin/ops/deals", icon: <Briefcase className="w-4 h-4" />, roles: ['admin', 'ops'] },
        { label: "RFQs", href: "/admin/ops/rfqs", icon: <Send className="w-4 h-4" />, roles: ['admin', 'ops'] },
        { label: "Receita", href: "/admin/ops/revenue", icon: <DollarSign className="w-4 h-4" />, roles: ['admin', 'ops'] },
      ]
    },
    {
      title: "Administração",
      icon: <Shield className="w-4 h-4" />,
      roles: ['admin'],
      items: [
        { label: "Visão Geral", href: "/admin/overview", icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin'] },
        { label: "Auditoria", href: "/admin/audit", icon: <FileText className="w-4 h-4" />, roles: ['admin'] },
        { label: "Configurações", href: "/admin/settings", icon: <Settings className="w-4 h-4" />, roles: ['admin'] },
        { label: "Fornecedores", href: "/admin/suppliers", icon: <Building2 className="w-4 h-4" />, roles: ['admin'] },
      ]
    }
  ];

  const filteredSections = navSections.filter(section => 
    user && section.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href === '/admin/sales' && location === '/admin/sales') return true;
    if (href === '/admin/ops' && location === '/admin/ops') return true;
    if (href === '/admin/overview' && location === '/admin/overview') return true;
    return location.startsWith(href) && href !== '/admin/sales' && href !== '/admin/ops' && href !== '/admin/overview';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Ótima OS</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title.toLowerCase())}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span>{section.title}</span>
                </div>
                {expandedSections.includes(section.title.toLowerCase()) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections.includes(section.title.toLowerCase()) && (
                <div className="ml-4 space-y-1">
                  {section.items
                    .filter(item => user && item.roles.includes(user.role))
                    .map((item) => (
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
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))}
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
