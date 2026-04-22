import { AdminLayout } from "@/components/layouts/AdminLayout";
import { DemoDataPanel } from "@/components/admin/DemoDataPanel";
import { BrandKitPanel } from "@/components/admin/BrandKitPanel";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Settings, Database, Shield, Globe, Palette, Users, Building2, CheckCircle, Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminSettings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ suppliers: number; playbooks: number; coverage: number; contacts: number } | null>(null);
  const [fixingUnits, setFixingUnits] = useState(false);
  const [fixUnitsResult, setFixUnitsResult] = useState<{ checked: number; fixed: number } | null>(null);
  const [seedingConf, setSeedingConf] = useState(false);
  const [confResult, setConfResult] = useState<{ deals: number; quotes: number; skipped?: boolean; message?: string } | null>(null);

  const seedSuppliers = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/seed-suppliers");
      const data = await res.json();
      if (data.success) {
        setSeedResult(data.results);
        toast({
          title: "Fornecedores importados",
          description: `${data.results?.suppliers || 0} fornecedores, ${data.results?.playbooks || 0} playbooks, ${data.results?.coverage || 0} coberturas GD`,
        });
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao importar fornecedores", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao importar fornecedores", variant: "destructive" });
    }
    setSeeding(false);
  };

  const seedConferenceDeals = async () => {
    setSeedingConf(true);
    setConfResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/seed-conference-deals");
      const data = await res.json();
      if (data.success) {
        setConfResult(data.results || { deals: 0, quotes: 0, skipped: data.skipped, message: data.message });
        toast({
          title: data.skipped ? "Deals já existem" : "Deals criados!",
          description: data.skipped ? data.message : `${data.results?.deals} deals, ${data.results?.quotes} cotações criadas`,
        });
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao criar deals", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao criar deals de conferência", variant: "destructive" });
    }
    setSeedingConf(false);
  };

  const fixUnits = async () => {
    setFixingUnits(true);
    setFixUnitsResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/fix-consumption-units");
      const data = await res.json();
      if (data.success) {
        setFixUnitsResult({ checked: data.checked, fixed: data.fixed });
        toast({
          title: "Unidades corrigidas",
          description: `${data.fixed} dossiers corrigidos de ${data.checked} verificados.`,
        });
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao corrigir unidades", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao corrigir unidades", variant: "destructive" });
    }
    setFixingUnits(false);
  };

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
            <TabsTrigger value="brand" className="flex items-center gap-2" data-testid="tab-brand">
              <Palette className="h-4 w-4" />
              Brand Kit
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2" data-testid="tab-security">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2" data-testid="tab-suppliers">
              <Building2 className="h-4 w-4" />
              Fornecedores
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2" data-testid="tab-integrations">
              <Globe className="h-4 w-4" />
              Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demo">
            <DemoDataPanel />
          </TabsContent>

          <TabsContent value="brand">
            <BrandKitPanel />
          </TabsContent>

          <TabsContent value="security">
            <UserManagementPanel />
          </TabsContent>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Importar Fornecedores
                </CardTitle>
                <CardDescription>
                  Importa o catálogo base de fornecedores com playbooks RFQ, cobertura GD e contatos padrão.
                  A operação é idempotente — pode ser executada múltiplas vezes sem duplicar dados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-medium">Fornecedores incluídos:</p>
                  <ul className="space-y-1 text-muted-foreground ml-2">
                    <li>• <strong>Prime Energy</strong> — ACL Atacado/Varejo + GD BT/MT (SP, MG, MT, MS, GO, BA, PI, PR)</li>
                    <li>• <strong>ATMO Energia</strong> — GD BT (CEMIG MG + COPEL PR)</li>
                    <li>• <strong>CEMIG</strong> — ACL Convencional (SE/CO)</li>
                    <li>• <strong>Delantis Energias Renováveis</strong> — GD Compensação Nacional</li>
                    <li>• <strong>Genial Energia</strong> — GD BT (Light + Enel RJ)</li>
                  </ul>
                </div>

                {seedResult && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg" data-testid="seed-result">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline" className="text-green-700 border-green-300">{seedResult.suppliers} fornecedores</Badge>
                      <Badge variant="outline" className="text-green-700 border-green-300">{seedResult.playbooks} playbooks</Badge>
                      <Badge variant="outline" className="text-green-700 border-green-300">{seedResult.coverage} coberturas GD</Badge>
                      <Badge variant="outline" className="text-green-700 border-green-300">{seedResult.contacts} contatos</Badge>
                    </div>
                  </div>
                )}

                <Button
                  onClick={seedSuppliers}
                  disabled={seeding}
                  data-testid="button-seed-suppliers"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Importar Fornecedores
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Corrigir Unidades de Consumo
                </CardTitle>
                <CardDescription>
                  Detecta e corrige dossiers onde o consumo foi salvo em kWh em vez de MWh.
                  Usa heurística: consumo anual &gt; 1.000 com demanda &lt; 100 kW.
                  A operação é segura e pode ser executada múltiplas vezes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fixUnitsResult && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg" data-testid="fix-units-result">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <div className="text-sm text-green-800">
                      <span className="font-medium">{fixUnitsResult.fixed}</span> dossier(s) corrigido(s) de{' '}
                      <span className="font-medium">{fixUnitsResult.checked}</span> verificados.
                      {fixUnitsResult.fixed === 0 && ' Nenhuma correção necessária.'}
                    </div>
                  </div>
                )}
                <Button
                  onClick={fixUnits}
                  disabled={fixingUnits}
                  variant="outline"
                  data-testid="button-fix-units"
                >
                  {fixingUnits ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Corrigir unidades de consumo (kWh → MWh)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dados para Conferência
                </CardTitle>
                <CardDescription>
                  Cria 4 deals (2 GD + 2 ACL) com cotações reais dos 5 fornecedores cadastrados (Prime, ATMO, CEMIG, Delantis, Genial) para demonstração do painel de comparação. Execute "Importar Fornecedores" antes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {confResult && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg" data-testid="conf-result">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    <div className="text-sm text-green-800">
                      {confResult.skipped
                        ? confResult.message
                        : <><span className="font-medium">{confResult.deals}</span> deals e <span className="font-medium">{confResult.quotes}</span> cotações criadas.</>
                      }
                    </div>
                  </div>
                )}
                <Button
                  onClick={seedConferenceDeals}
                  disabled={seedingConf}
                  data-testid="button-seed-conference-deals"
                >
                  {seedingConf ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando deals...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Criar Deals para Conferência
                    </>
                  )}
                </Button>
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
