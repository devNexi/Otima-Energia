import { useAuth, UserRole } from "@/lib/auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = "/admin" }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/admin" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const defaultRoute = getRoleLandingPage(user.role);
    return <Redirect to={defaultRoute} />;
  }

  return <>{children}</>;
}

export function getRoleLandingPage(role: UserRole): string {
  return '/admin/deals';
}

export function AccessDenied() {
  const { user } = useAuth();
  const landingPage = user ? getRoleLandingPage(user.role) : '/admin';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl">🚫</div>
      <h1 className="text-2xl font-bold">Acesso Negado</h1>
      <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
      <a href={landingPage} className="text-primary hover:underline">
        Voltar para o início
      </a>
    </div>
  );
}
