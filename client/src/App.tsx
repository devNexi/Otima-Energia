import { Switch, Route, Redirect, useParams, useLocation } from "wouter";
import { useEffect } from "react";
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
import Reduza from "@/pages/Reduza";
import Obrigado from "@/pages/Obrigado";
import SalesOSQueue from "@/pages/SalesOS/Queue";
import SalesOSLeadCard from "@/pages/SalesOS/LeadCard";
import SalesOSReplies from "@/pages/SalesOS/Replies";
import SalesOSManager from "@/pages/SalesOS/Manager";
import SalesOSCoaching from "@/pages/SalesOS/Coaching";
import SalesOSPerformance from "@/pages/SalesOS/Performance";
import KeywordResearch from "@/pages/KeywordResearch";
import GoogleAdsDiagnostics from "@/pages/GoogleAdsDiagnostics";
import GoogleAdsLaunchPack from "@/pages/GoogleAdsLaunchPack";
import PpcManager from "@/pages/PpcManager";
import Parceiros from "@/pages/Parceiros";
import GdParaEmpresas from "@/pages/GdParaEmpresas";
import MercadoLivreAcl from "@/pages/MercadoLivreAcl";
import GestaoDeEnergia from "@/pages/GestaoDeEnergia";
import OtimizacaoEnergetica from "@/pages/OtimizacaoEnergetica";
import Ecos from "@/pages/Ecos";
import Contato from "@/pages/Contato";

const VALID_DEAL_TABS = ['assembly', 'overview', 'rfq', 'quotes', 'proposals', 'commission', 'documents', 'history', 'cases', 'tracks', 'sales', 'compliance', 'ecos', 'details'];

function AdminDealRoute() {
  const { dealId } = useParams<{ dealId: string }>();
  const rawTab = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('tab')
    : null;
  const initialTab = rawTab && VALID_DEAL_TABS.includes(rawTab) ? rawTab : 'details';

  if (typeof window !== 'undefined') {
    console.log(`[DeepLink] AdminDealRoute: dealId=${dealId} rawTab=${rawTab} resolvedTab=${initialTab || 'default'} url=${window.location.href}`);
  }

  return <Admin defaultTab="deals" initialDealId={dealId} initialDealTab={initialTab} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sobre" component={About} />
      {/* /equipe kept as route but not linked in nav/footer */}
      <Route path="/equipe" component={Team} />
      <Route path="/parceiros" component={Parceiros} />
      <Route path="/solucoes" component={Solutions} />
      <Route path="/faq" component={FAQ} />
      <Route path="/seja-cliente" component={BecomeClient} />
      <Route path="/privacidade" component={Privacy} />
      <Route path="/termos" component={Terms} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/portal-cliente" component={ClientPortal} />
      <Route path="/lei-mercado-livre" component={LeiMercadoLivre} />
      <Route path="/renovacao-contrato" component={RenovacaoContrato} />
      <Route path="/diagnostico" component={DiagnosticoForm} />
      <Route path="/insights" component={Insights} />
      <Route path="/termos-parcerias" component={TermosParcerias} />

      <Route path="/ecos" component={Ecos} />
      <Route path="/contato" component={Contato} />

      {/* New service pages */}
      <Route path="/gd-para-empresas" component={GdParaEmpresas} />
      <Route path="/mercado-livre-acl" component={MercadoLivreAcl} />
      <Route path="/gestao-de-energia" component={GestaoDeEnergia} />
      <Route path="/otimizacao-energetica" component={OtimizacaoEnergetica} />

      {/* Legacy redirects */}
      <Route path="/energia-por-assinatura-gdl">{() => <Redirect to="/gd-para-empresas" />}</Route>
      <Route path="/rede-de-lucros-otima">{() => <Redirect to="/parceiros" />}</Route>

      {/* Portal routes */}
      <Route path="/portal/upload/:token" component={Portal} />
      <Route path="/client/intake/:token" component={Portal} />
      <Route path="/proposta/:publicId" component={PublicProposal} />
      <Route path="/proposta-preview" component={ProposalPreview} />
      <Route path="/proposal/view/:token" component={ProposalView} />

      {/* Admin routes */}
      <Route path="/admin">{() => <Redirect to="/admin/deals" />}</Route>
      <Route path="/admin/suppliers/:id" component={SupplierDetail} />
      <Route path="/admin/suppliers" component={SupplierManager} />
      <Route path="/admin/deals/:dealId" component={AdminDealRoute} />
      <Route path="/admin/ops/deals/:dealId" component={AdminDealRoute} />
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
      <Route path="/admin/keyword-research" component={KeywordResearch} />
      <Route path="/admin/google-ads-diagnostics" component={GoogleAdsDiagnostics} />
      <Route path="/admin/google-ads-launch-pack" component={GoogleAdsLaunchPack} />
      <Route path="/admin/ppc-manager" component={PpcManager} />
      <Route path="/admin/qa" component={QaConsole} />
      <Route path="/admin/qa/history" component={QaHistory} />
      <Route path="/admin/walkthrough" component={RenanWalkthrough} />
      <Route path="/admin/tracks" component={TracksQueue} />
      <Route path="/admin/quote-inbox" component={QuoteInbox} />
      <Route path="/admin/verify" component={VerificationPage} />
      <Route path="/admin/dossier/:clientId" component={DossierPage} />
      <Route path="/reduza" component={Reduza} />
      <Route path="/obrigado" component={Obrigado} />

      {/* ─── Sales OS ──────────────────────────────────────────────────── */}
      <Route path="/sales-os">{() => { window.location.replace("/sales-os/queue"); return null; }}</Route>
      <Route path="/sales-os/queue" component={SalesOSQueue} />
      <Route path="/sales-os/leads/:id" component={SalesOSLeadCard} />
      <Route path="/sales-os/replies" component={SalesOSReplies} />
      <Route path="/sales-os/manager" component={SalesOSManager} />
      <Route path="/sales-os/coaching" component={SalesOSCoaching} />
      <Route path="/sales-os/performance" component={SalesOSPerformance} />

      <Route component={NotFound} />
    </Switch>
  );
}

// ─── Floating WhatsApp button — public pages only ─────────────────────────────
const WA_BASE_NUMBER = "5521997959777";
const WA_MSG_REDUZA = encodeURIComponent("Olá! Vi o site da Ótima Energia e gostaria de saber mais sobre desconto na conta de luz para minha empresa.");
const WA_MSG_GENERAL = encodeURIComponent("Olá! Acessei o site da Ótima Energia e gostaria de saber mais.");
const WA_SVG = <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
const HIDDEN_PREFIXES = ["/admin", "/portal", "/client", "/proposta", "/proposal", "/sales-os"];

function fireFloatingWaEvent() {
  try {
    const params = { source: "landing_page", page: window.location.pathname };
    const w = window as any;
    if (w.gtag) w.gtag("event", "whatsapp_click_floating", params);
    else if (w.dataLayer) w.dataLayer.push({ event: "whatsapp_click_floating", ...params });
  } catch {}
}

function FloatingWhatsApp() {
  const [location] = useLocation();
  const hidden = HIDDEN_PREFIXES.some(p => location.startsWith(p));
  if (hidden) return null;

  const isReducza = location === "/reduza";
  const waUrl = `https://wa.me/${WA_BASE_NUMBER}?text=${isReducza ? WA_MSG_REDUZA : WA_MSG_GENERAL}`;

  if (isReducza) {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar pelo WhatsApp"
        onClick={fireFloatingWaEvent}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          background: "#25D366", color: "#fff",
          borderRadius: "50%", width: "56px", height: "56px",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(37,211,102,0.35)",
          textDecoration: "none", opacity: 0.85,
          transition: "opacity 0.15s, transform 0.15s",
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = "1"; el.style.transform = "scale(1.05)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = "0.85"; el.style.transform = "scale(1)"; }}
        data-testid="btn-floating-whatsapp"
      >
        {WA_SVG}
      </a>
    );
  }

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar pelo WhatsApp"
      onClick={fireFloatingWaEvent}
      style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
        background: "#25D366", color: "#fff",
        borderRadius: "50px", padding: "14px 20px",
        display: "flex", alignItems: "center", gap: "8px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontWeight: 700, fontSize: "15px",
        boxShadow: "0 4px 20px rgba(37,211,102,0.45)",
        textDecoration: "none",
        transition: "transform 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      data-testid="btn-floating-whatsapp"
    >
      {WA_SVG}
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}

declare const __GTM_ID__: string;
declare const __GA_MEASUREMENT_ID__: string;

function useTrackingInit() {
  useEffect(() => {
    const gtmId: string = typeof __GTM_ID__ !== "undefined" ? __GTM_ID__ : "";
    const gaId: string = typeof __GA_MEASUREMENT_ID__ !== "undefined" ? __GA_MEASUREMENT_ID__ : "";

    if (gtmId) {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(script);

      const noscript = document.createElement("noscript");
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.insertBefore(noscript, document.body.firstChild);
    } else if (gaId) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function (...args: any[]) { (window as any).dataLayer.push(args); };
      (window as any).gtag("js", new Date());
      (window as any).gtag("config", gaId);
    }
  }, []);
}

function App() {
  useTrackingInit();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <FloatingWhatsApp />
            <CookieConsent />
          </TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
