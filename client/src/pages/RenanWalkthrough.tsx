import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Upload,
  DollarSign,
  Send,
  CheckCircle,
  Building,
  Receipt,
  Shield,
  Zap,
  ExternalLink,
  AlertTriangle,
  Lock,
  Star,
  Eye,
  Mail,
  Users,
  BookOpen,
  Info,
} from "lucide-react";

interface WalkthroughStep {
  number: number;
  title: string;
  description: string;
  actions: string[];
  link?: string;
  linkLabel?: string;
  tip?: string;
  rule?: string;
  processNote?: string;
}

interface WalkthroughSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: WalkthroughStep[];
}

const sections: WalkthroughSection[] = [
  {
    id: "deal-creation",
    title: "1. Deal Creation",
    icon: <FileText className="h-5 w-5" />,
    description: "A new deal may originate from Zoho CRM integration or be created manually by the Account Executive (AE).",
    steps: [
      {
        number: 1,
        title: "Automated Entry via Zoho CRM",
        description: "When a lead is qualified in Zoho CRM, the system automatically creates a corresponding deal in the portal via the integrated workflow.",
        actions: [
          "The system receives lead data from Zoho CRM via the integrated intake workflow",
          "The portal creates the deal record with all fields from the qualified lead",
          "A read-only banner is displayed: 'Originated from Zoho CRM \u2022 Operational control in \u00d3tima'",
          "All Zoho-originated fields remain read-only within the portal"
        ],
        tip: "Deals originated from Zoho appear automatically in the Deals list. No manual action is required by the AE."
      },
      {
        number: 2,
        title: "Manual Deal Creation",
        description: "For leads acquired outside of Zoho CRM (referrals, WhatsApp, direct contact, etc.), the AE creates the deal manually.",
        actions: [
          "The AE navigates to 'Neg\u00f3cios' (Deals) in the sidebar menu",
          "The AE selects 'Novo Neg\u00f3cio' (New Deal)",
          "The AE completes required fields: client name, company, contact information, segment",
          "The AE assigns the deal owner (Account Executive responsible)",
          "The AE saves the deal record"
        ],
        link: "/admin/deals",
        linkLabel: "Navigate to Deals"
      }
    ]
  },
  {
    id: "dossier",
    title: "2. Client Dossier Creation",
    icon: <Upload className="h-5 w-5" />,
    description: "The Dossier is the canonical energy profile for the client. It serves as the foundational data source for all RFQ workflows and proposals.",
    steps: [
      {
        number: 3,
        title: "Energy Bill Upload & Data Extraction",
        description: "The AE uploads the client\u2019s energy bill to extract consumption data via automated OCR processing.",
        actions: [
          "The AE opens the target deal record",
          "The AE navigates to the 'Dossi\u00ea' (Dossier) tab",
          "The AE uploads the energy bill document (PDF or image format)",
          "The system performs automated data extraction via OCR",
          "The AE reviews the extracted data fields and corrects any inaccuracies"
        ],
        tip: "Higher-quality document scans result in more accurate automated extraction."
      },
      {
        number: 4,
        title: "Dossier Verification & Lock",
        description: "After validating all extracted data, the AE locks the Dossier to ensure data integrity for downstream processes.",
        actions: [
          "The AE verifies: CNPJ, legal entity name (raz\u00e3o social), distributor, submarket",
          "The AE verifies: monthly/annual consumption (MWh), demand (kW)",
          "The AE verifies: tariff class (A4, A3, etc.)",
          "The AE advances the Dossier status: DRAFT \u2192 READY \u2192 LOCKED",
          "Once locked, Dossier data becomes immutable"
        ],
        rule: "A Dossier must be in the LOCKED state before any RFQ can be sent to suppliers.",
        tip: "The locked Dossier serves as the immutable baseline for all quotations and proposals."
      }
    ]
  },
  {
    id: "quotes",
    title: "3. Quote Intake & Customer Pricing",
    icon: <DollarSign className="h-5 w-5" />,
    description: "The AE registers supplier quotations received through various channels and applies the customer-facing price with margin.",
    steps: [
      {
        number: 5,
        title: "Supplier Quote Registration",
        description: "The AE registers quotations received from energy suppliers (via WhatsApp, email, phone, etc.) into the system.",
        actions: [
          "Within the deal record, the AE navigates to the 'Cota\u00e7\u00f5es' (Quotes) tab",
          "The AE selects 'Nova Cota\u00e7\u00e3o' (New Quote)",
          "The AE selects the supplier from the registered suppliers list",
          "The AE completes required fields: price (R$/MWh), contract term (months), product type",
          "The system automatically generates a SHA-256 hash for immutability verification",
          "The quotation is stored as an immutable record"
        ],
        link: "/admin/deals",
        linkLabel: "Navigate to Deals",
        processNote: "Current Method: Manual Entry. Future State: Quotes sent to rfq@otimaenergia.com will be parsed automatically."
      },
      {
        number: 6,
        title: "Set Customer Price (MANDATORY)",
        description: "For each quotation intended for inclusion in a proposal, the AE must define the customer-facing price including \u00d3tima\u2019s margin.",
        actions: [
          "On the quote record, the AE selects 'Definir Pre\u00e7o ao Cliente' (Set Customer Price)",
          "The AE selects the margin type: R$/MWh (fixed) or Percentage (%)",
          "The AE enters the margin value (e.g., R$ 5.00/MWh or 3%)",
          "The system displays the automatically calculated customer price preview",
          "The AE selects 'Confirmar Pre\u00e7o' (Confirm Price) to save",
          "The quote badge updates to 'Pronto' (Ready, green) = eligible for proposal inclusion"
        ],
        rule: "This step is MANDATORY. Proposals can only include quotations that have a confirmed Customer Price.",
        tip: "The Customer Price is the only price visible to the client. The supplier base price and margin are never exposed."
      }
    ]
  },
  {
    id: "proposals",
    title: "4. Proposal Assembly & Delivery",
    icon: <Star className="h-5 w-5" />,
    description: "The AE assembles the commercial proposal using the guided wizard and delivers it to the client.",
    steps: [
      {
        number: 7,
        title: "Access the Proposals Module",
        description: "The AE navigates to the dedicated Proposals management module.",
        actions: [
          "The AE selects 'Propostas' (Proposals) from the sidebar navigation",
          "Alternatively, the AE accesses the 'Propostas' tab within a specific deal record",
          "The AE reviews the proposals list with current status indicators"
        ],
        link: "/admin/proposals",
        linkLabel: "Navigate to Proposals"
      },
      {
        number: 8,
        title: "Proposal Wizard (4-Step Process)",
        description: "The system guides the AE through a structured 4-step process to assemble the proposal.",
        actions: [
          "Step 1: Select the target Deal",
          "Step 2: Select eligible Quotes (only quotes with confirmed Customer Price are displayed)",
          "  \u2192 If multiple quotes: designate the recommended option and provide justification",
          "Step 3: Configure proposal validity period (7/15/30/45/60 days)",
          "Step 4: Review all details and select 'Gerar Proposta' (Generate Proposal)",
          "The system generates the public shareable URL and PDF document automatically"
        ],
        tip: "The generated proposal displays: Customer Price, estimated monthly cost, estimated annual cost, and savings versus current energy bill."
      },
      {
        number: 9,
        title: "Proposal Delivery to Client",
        description: "The AE sends the proposal to the client via email directly from the portal.",
        actions: [
          "On the generated proposal, the AE selects 'Enviar por Email' (Send via Email)",
          "The AE enters the recipient\u2019s email address",
          "The AE may add a personalized message (optional)",
          "The AE selects 'Enviar' (Send) to deliver",
          "Proposal status updates to 'SENT'",
          "When the client opens the proposal link, status automatically updates to 'VIEWED'"
        ],
        tip: "View tracking analytics allow the AE to monitor how many times the client has viewed the proposal."
      }
    ]
  },
  {
    id: "closing",
    title: "5. Contract Closure & Commission Collection",
    icon: <Receipt className="h-5 w-5" />,
    description: "The Operations Manager (Ops) manages contract execution and commission collection using the 50/50 milestone model.",
    steps: [
      {
        number: 10,
        title: "Proposal Acceptance & Contract Signature",
        description: "When the client accepts the proposal and executes the contract, the Operations Manager processes the deal advancement.",
        actions: [
          "The Ops Manager updates the proposal status to 'ACCEPTED'",
          "The Ops Manager advances the deal to 'CONTRACT_SIGNED' status",
          "The system automatically generates a draft invoice for 50% of the commission (Milestone 1)"
        ],
        tip: "Milestone 1 = 50% of total commission, triggered upon contract signature (CONTRACT_SIGNED)."
      },
      {
        number: 11,
        title: "CCEE Activation (Supply Live)",
        description: "When the supplier activates supply in CCEE, the Operations Manager processes the final milestone.",
        actions: [
          "The Ops Manager advances the deal to 'CCEE_ACTIVE' (Supply Live) status",
          "The system automatically generates a draft invoice for the remaining 50% (Milestone 2)",
          "The Ops Manager reviews all draft invoices in the Commission module",
          "The Ops Manager submits invoices and tracks payment status"
        ],
        link: "/admin/commission",
        linkLabel: "Navigate to Commission",
        tip: "Milestone 2 = remaining 50% of commission, triggered when supply is active in CCEE."
      },
      {
        number: 12,
        title: "Payment Tracking & Reconciliation",
        description: "The Operations Manager manages the full lifecycle of commission invoices.",
        actions: [
          "The Ops Manager navigates to 'Comiss\u00e3o' (Commission) in the sidebar menu",
          "The Ops Manager reviews invoices by status: pending, submitted, paid",
          "Upon payment confirmation, the Ops Manager marks invoices as paid",
          "The Ops Manager exports financial reports in CSV format for accounting reconciliation"
        ]
      }
    ]
  }
];

export default function RenanWalkthrough() {
  const { user } = useAuth();

  if (user?.role !== "admin" && user?.role !== "sales" && user?.role !== "ops") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">This document is restricted to internal team members.</p>
            <Link href="/admin">
              <Button>Return</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/deals">
              <Button variant="ghost" size="sm" data-testid="link-back-admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="h-8 w-8 text-violet-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-sop-title">
                \u00d3tima Portal: Deal Execution SOP (Standard Operating Procedure)
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Version 1.0 | For Sales & Operations Teams
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Badge className="bg-violet-100 text-violet-700">12 Steps</Badge>
            <Badge className="bg-emerald-100 text-emerald-700">5 Phases</Badge>
            <Badge className="bg-blue-100 text-blue-700">50/50 Commission Model</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Core Principle */}
        <Card className="border-violet-300 bg-gradient-to-r from-violet-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-violet-900">Core Principle</h3>
                <p className="text-sm text-violet-800 mt-1">
                  The portal operates on three pricing layers: <strong>Supplier Price</strong> (Internal) &rarr; <strong>Customer Price</strong> (+ Margin) &rarr; <strong>Proposal</strong> (Client-Facing). The client never sees internal economics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Roles */}
        <Card className="border-gray-200 bg-white" data-testid="card-primary-roles">
          <CardContent className="pt-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              Primary Roles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-bold text-blue-900">Account Executive (AE)</p>
                <p className="text-sm text-blue-700 mt-1">Responsible for Steps 1&ndash;9</p>
                <p className="text-xs text-blue-600 mt-1">Deal Creation through Proposal Delivery</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-sm font-bold text-emerald-900">Operations Manager (Ops)</p>
                <p className="text-sm text-emerald-700 mt-1">Responsible for Steps 10&ndash;12</p>
                <p className="text-xs text-emerald-600 mt-1">Contract Closure through Commission Collection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Execution Summary Flow */}
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-violet-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Deal Execution Summary Flow
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">1. Deal Creation</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="outline">2. Client Dossier</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="outline">3. Quote Intake & Pricing</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="outline">4. Proposal Assembly</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge className="bg-emerald-100 text-emerald-700">5. Closure & Commission 50/50</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Protection Warning */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Revenue Protection Architecture</h3>
                <p className="text-sm text-amber-800 mt-1">
                  The system enforces three layers of price protection: <strong>Supplier Price</strong> (internal, never exposed) &rarr; <strong>Customer Price</strong> (includes \u00d3tima margin) &rarr; <strong>Proposal Document</strong> (client-facing output). 
                  The client is never exposed to the supplier base price or \u00d3tima&rsquo;s margin. All PDFs and public links are automatically verified for internal field leaks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Model */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Receipt className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Commission Model: 50/50 Milestone Structure</h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">MILESTONE 1 &mdash; 50%</p>
                    <p className="text-sm text-blue-900 mt-1">Triggered when the deal reaches <strong>CONTRACT_SIGNED</strong></p>
                    <p className="text-xs text-blue-600 mt-2">Draft invoice generated automatically</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">MILESTONE 2 &mdash; 50%</p>
                    <p className="text-sm text-blue-900 mt-1">Triggered when the deal reaches <strong>CCEE_ACTIVE</strong> (Supply Live)</p>
                    <p className="text-xs text-blue-600 mt-2">Draft invoice generated automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.id}>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4" data-testid={`section-${section.id}`}>
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-600">
                {section.icon}
              </span>
              {section.title}
            </h2>
            <p className="text-gray-600 mb-4 ml-10">{section.description}</p>

            <div className="space-y-4 ml-10">
              {section.steps.map((step) => (
                <Card key={step.number} data-testid={`step-${step.number}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex-shrink-0">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                        <ul className="mt-3 space-y-1.5">
                          {step.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>

                        {step.rule && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-800 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Rule:</strong> {step.rule}</span>
                          </div>
                        )}

                        {step.processNote && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800 flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Process Note:</strong> {step.processNote}</span>
                          </div>
                        )}

                        {step.tip && (
                          <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-800 flex items-start gap-2">
                            <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Best Practice:</strong> {step.tip}</span>
                          </div>
                        )}

                        {step.link && (
                          <Link href={step.link}>
                            <Button variant="outline" size="sm" className="mt-3" data-testid={`link-step-${step.number}`}>
                              <ExternalLink className="h-3 w-3 mr-2" />
                              {step.linkLabel || "Navigate to page"}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="mt-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
