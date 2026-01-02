import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { CookieConsent } from "@/components/ui/cookie-consent";
import Home from "@/pages/Home";
import Portal from "@/pages/Portal";
import Admin from "@/pages/Admin";
import Partners from "@/pages/Partners";
import About from "@/pages/About";
import Team from "@/pages/Team";
import Solutions from "@/pages/Solutions";
import FAQ from "@/pages/FAQ";
import BecomeClient from "@/pages/BecomeClient";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Cookies from "@/pages/Cookies";
import ClientPortal from "@/pages/ClientPortal";
import LeiMercadoLivre from "@/pages/LeiMercadoLivre";
import RenovacaoContrato from "@/pages/RenovacaoContrato";
import Insights from "@/pages/Insights";
import RedeLucros from "@/pages/RedeLucros";
import TermosParcerias from "@/pages/TermosParcerias";
import SupplierManager from "@/pages/SupplierManager";
import ProposalTracker from "@/pages/ProposalTracker";
import BenchmarkManager from "@/pages/BenchmarkManager";
import AdminSettings from "@/pages/AdminSettings";
import NotFound from "@/pages/not-found";
import PublicProposal from "@/pages/PublicProposal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sobre" component={About} />
      <Route path="/equipe" component={Team} />
      <Route path="/parceiros" component={Partners} />
      <Route path="/solucoes" component={Solutions} />
      <Route path="/faq" component={FAQ} />
      <Route path="/seja-cliente" component={BecomeClient} />
      <Route path="/privacidade" component={Privacy} />
      <Route path="/termos" component={Terms} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/portal-cliente" component={ClientPortal} />
      <Route path="/lei-mercado-livre" component={LeiMercadoLivre} />
      <Route path="/renovacao-contrato" component={RenovacaoContrato} />
      <Route path="/insights" component={Insights} />
      <Route path="/rede-de-lucros-otima" component={RedeLucros} />
      <Route path="/termos-parcerias" component={TermosParcerias} />
      <Route path="/portal/upload/:token" component={Portal} />
      <Route path="/proposta/:publicId" component={PublicProposal} />
      
      {/* Admin routes - redirect /admin to /admin/deals */}
      <Route path="/admin">{() => <Redirect to="/admin/deals" />}</Route>
      <Route path="/admin/suppliers" component={SupplierManager} />
      <Route path="/admin/deals" component={() => <Admin defaultTab="deals" />} />
      <Route path="/admin/ecos" component={() => <Admin defaultTab="ecos-dashboard" />} />
      <Route path="/admin/rfqs" component={() => <Admin defaultTab="rfqs" />} />
      <Route path="/admin/ops-dashboard" component={() => <Admin defaultTab="ops-dashboard" />} />
      <Route path="/admin/clients" component={() => <Admin defaultTab="clients" />} />
      <Route path="/admin/commission" component={() => <Admin defaultTab="revenue" />} />
      <Route path="/admin/overview" component={() => <Admin defaultTab="overview" />} />
      <Route path="/admin/audit" component={() => <Admin defaultTab="audit-trail" />} />
      <Route path="/admin/integrations" component={() => <Admin defaultTab="integrations" />} />
      <Route path="/admin/proposals" component={ProposalTracker} />
      <Route path="/admin/benchmarks" component={BenchmarkManager} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <CookieConsent />
          </TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
