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
import SupplierDetail from "@/pages/SupplierDetail";
import ProposalTracker from "@/pages/ProposalTracker";
import ProposalsManager from "@/pages/ProposalsManager";
import BenchmarkManager from "@/pages/BenchmarkManager";
import PrcUploadCenter from "@/pages/PrcUploadCenter";
import PrcReviewPage from "@/pages/PrcReviewPage";
import EcosValidationPage from "@/pages/EcosValidationPage";
import AdminSettings from "@/pages/AdminSettings";
import QaConsole from "@/pages/QaConsole";
import QaHistory from "@/pages/QaHistory";
import RenanWalkthrough from "@/pages/RenanWalkthrough";
import ProposalView from "@/pages/ProposalView";
import NotFound from "@/pages/not-found";
import PublicProposal from "@/pages/PublicProposal";
import ProposalPreview from "@/pages/ProposalPreview";
import QuoteInbox from "@/pages/QuoteInbox";
import EnergiaAssinatura from "@/pages/EnergiaAssinatura";
import DiagnosticoForm from "@/pages/DiagnosticoForm";
import TracksQueue from "@/pages/TracksQueue";
import VerificationPage from "@/pages/VerificationPage";
import DossierPage from "@/pages/DossierPage";

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
      <Route path="/energia-por-assinatura-gdl" component={EnergiaAssinatura} />
      <Route path="/diagnostico" component={DiagnosticoForm} />
      <Route path="/insights" component={Insights} />
      <Route path="/rede-de-lucros-otima" component={RedeLucros} />
      <Route path="/termos-parcerias" component={TermosParcerias} />
      <Route path="/portal/upload/:token" component={Portal} />
      <Route path="/client/intake/:token" component={Portal} />
      <Route path="/proposta/:publicId" component={PublicProposal} />
      <Route path="/proposta-preview" component={ProposalPreview} />
      <Route path="/proposal/view/:token" component={ProposalView} />
      
      {/* Admin routes - redirect /admin to /admin/deals */}
      <Route path="/admin">{() => <Redirect to="/admin/deals" />}</Route>
      <Route path="/admin/suppliers/:id" component={SupplierDetail} />
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
      <Route path="/admin/proposals" component={ProposalsManager} />
      <Route path="/admin/proposals-legacy" component={ProposalTracker} />
      <Route path="/admin/benchmarks" component={BenchmarkManager} />
      <Route path="/admin/prc" component={PrcUploadCenter} />
      <Route path="/admin/prc/review/:id" component={PrcReviewPage} />
      <Route path="/admin/ecos/validation" component={EcosValidationPage} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/qa" component={QaConsole} />
      <Route path="/admin/qa/history" component={QaHistory} />
      <Route path="/admin/walkthrough" component={RenanWalkthrough} />
      <Route path="/admin/tracks" component={TracksQueue} />
      <Route path="/admin/quote-inbox" component={QuoteInbox} />
      <Route path="/admin/verify" component={VerificationPage} />
      <Route path="/admin/dossier/:clientId" component={DossierPage} />
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
