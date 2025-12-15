import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
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
import SupplierManager from "@/pages/SupplierManager";
import ProposalTracker from "@/pages/ProposalTracker";
import BenchmarkManager from "@/pages/BenchmarkManager";
import NotFound from "@/pages/not-found";

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
      <Route path="/portal/upload/:token" component={Portal} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/suppliers" component={SupplierManager} />
      <Route path="/admin/proposals" component={ProposalTracker} />
      <Route path="/admin/benchmarks" component={BenchmarkManager} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieConsent />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
