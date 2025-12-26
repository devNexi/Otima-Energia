import { AdminLayout } from "@/components/layouts/AdminLayout";
import { DemoDataPanel } from "@/components/admin/DemoDataPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { Settings, Database, Shield, Globe } from "lucide-react";
import { Redirect } from "wouter";

export default function AdminSettings() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to="/admin" />;
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento e configuração do sistema Ótima OS
          </p>
        </div>

        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList>
            <TabsTrigger value="demo" className="flex items-center gap-2" data-testid="tab-demo">
              <Database className="h-4 w-4" />
              Demo Data
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2" data-testid="tab-security">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2" data-testid="tab-integrations">
              <Globe className="h-4 w-4" />
              Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demo">
            <DemoDataPanel />
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança e Acesso
                </CardTitle>
                <CardDescription>
                  Configurações de segurança e controle de acesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configurações de segurança serão disponibilizadas em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Integrações Externas
                </CardTitle>
                <CardDescription>
                  Conexões com sistemas externos e APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configurações de integrações serão disponibilizadas em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
