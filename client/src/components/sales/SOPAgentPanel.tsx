import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronDown, ChevronUp } from "lucide-react";
import type { Lead } from "@/data/mockLeads";

const SOP_CATALOGUE: { id: string; name: string; description: string }[] = [
  { id: "SOP-01", name: "Sales Intelligence", description: "Qualifica leads, gera score de prioridade, identifica segmento e barreira de confiança." },
  { id: "SOP-02", name: "Enriquecimento de Perfil", description: "Busca dados públicos de CNPJ, LinkedIn e portais de empresas para completar o cadastro." },
  { id: "SOP-03", name: "Bill Chase", description: "Executa sequência de acompanhamento para obter a conta de luz — 3 toques em 72h." },
  { id: "SOP-04", name: "Análise de Conta", description: "Processa a conta de luz recebida e calcula economia potencial de GD ou ACL." },
  { id: "SOP-05", name: "Follow-up Automático", description: "Envia mensagens de follow-up com base em regras de SLA e perfil do lead." },
  { id: "SOP-06", name: "Proposal Chase", description: "Acompanha propostas enviadas, monitora prazo de validade e agenda decisão." },
  { id: "SOP-07", name: "Call Tasking", description: "Prioriza e organiza a fila de chamadas do dia com base em score e janela de horário." },
  { id: "SOP-08", name: "Interrupção de Padrão", description: "Detecta leads travados com 5+ tentativas e sugere nova abordagem radical." },
  { id: "SOP-09", name: "QA de Chamada", description: "Analisa gravações de chamadas para garantir adesão ao script e qualidade do diálogo." },
  { id: "SOP-10", name: "Mapeamento de Objeções", description: "Identifica e categoriza objeções recorrentes para treino e melhoria de scripts." },
  { id: "SOP-11", name: "Inteligência Competitiva", description: "Monitora concorrentes mencionados nos leads e atualiza playbook de neutralização." },
  { id: "SOP-12", name: "Renovação de Lead", description: "Reativa leads arquivados com nova proposta de valor adaptada ao momento do mercado." },
  { id: "SOP-13", name: "Enriquecimento de DM", description: "Localiza contato direto do decisor-chave via LinkedIn, bases públicas e parceiros." },
  { id: "SOP-14", name: "Revisão Estratégica", description: "Analisa leads com 20+ tentativas e recomenda manter, mudar canal ou encerrar ciclo." },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  "Concluído": { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  "Executando": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Pendente": { color: "#9CA3AF", bg: "#F8F9FC", border: "#E8EAED" },
  "Aguardando Acionamento": { color: "#9CA3AF", bg: "#F8F9FC", border: "#E8EAED" },
  "Erro": { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

interface SopRow {
  id: string;
  name: string;
  description: string;
  status: string;
  lastRun: string | null;
  outputSummary: string | null;
  confidence: number | null;
  enhanced: boolean;
}

function buildRows(lead: Lead): SopRow[] {
  const knownMap: Record<string, (typeof lead.sop_agent_statuses)[number]> = {};
  for (const s of lead.sop_agent_statuses) {
    const match = s.sop.match(/SOP-\d+/);
    if (match) knownMap[match[0]] = s;
  }
  return SOP_CATALOGUE.map(cat => {
    const known = knownMap[cat.id];
    const isEnhanced = ["SOP-01", "SOP-03", "SOP-07", "SOP-13"].includes(cat.id);
    if (known) {
      return { id: cat.id, name: cat.name, description: cat.description, status: known.status, lastRun: known.last_run, outputSummary: known.output_summary, confidence: known.confidence, enhanced: isEnhanced };
    }
    if (cat.id === "SOP-13") {
      return {
        id: cat.id, name: cat.name, description: cat.description,
        status: lead.dm_direct_phone_best ? "Concluído" : "Aguardando Acionamento",
        lastRun: lead.dm_direct_phone_best ? "30/05" : null,
        outputSummary: lead.dm_direct_phone_best ? `Rota encontrada — confiança ${lead.dm_direct_phone_confidence ?? "?"}% · Tipo: ${lead.dm_direct_phone_type ?? "Desconhecido"}` : null,
        confidence: lead.dm_direct_phone_confidence, enhanced: true,
      };
    }
    return { id: cat.id, name: cat.name, description: cat.description, status: "Pendente", lastRun: null, outputSummary: null, confidence: null, enhanced: isEnhanced };
  });
}

function SOP01Detail({ lead }: { lead: Lead }) {
  return (
    <div className="mt-2 space-y-1 text-[11px]" style={{ color: "#6B7280" }}>
      <div><span style={{ color: "#9CA3AF" }}>Prioridade:</span> <strong style={{ color: "#9e3ffd" }}>{lead.priority_score}</strong></div>
      <div><span style={{ color: "#9CA3AF" }}>Segmento:</span> {lead.industry_segment}</div>
      <div><span style={{ color: "#9CA3AF" }}>Barreira:</span> {lead.likely_trust_barrier.level.charAt(0).toUpperCase() + lead.likely_trust_barrier.level.slice(1)}</div>
      <div><span style={{ color: "#9CA3AF" }}>Ângulo:</span> {lead.agent_recommendation.style}</div>
    </div>
  );
}

function SOP03Detail({ lead }: { lead: Lead }) {
  const billChase = lead.sop_agent_statuses.find(s => s.sop.toLowerCase().includes("bill chase") || s.sop.includes("05"));
  return (
    <div className="mt-2 space-y-1 text-[11px]" style={{ color: "#6B7280" }}>
      <div><span style={{ color: "#9CA3AF" }}>Fase:</span> Fase 1 — Dia 2 de 3</div>
      <div><span style={{ color: "#9CA3AF" }}>Próximo toque:</span> Amanhã 09:00</div>
      <div>{billChase?.output_summary ?? "WhatsApp de remoção de fricção enviado. Próximo: interrupção de padrão se sem resposta."}</div>
    </div>
  );
}

function SOP07Detail({ lead }: { lead: Lead }) {
  return (
    <div className="mt-2 space-y-1 text-[11px]" style={{ color: "#6B7280" }}>
      <div><span style={{ color: "#9CA3AF" }}>Rank:</span> #{lead.dialer_priority_rank}</div>
      <div><span style={{ color: "#9CA3AF" }}>Tipo:</span> {lead.dialer_queue_type.replace(/_/g, " ")}</div>
      <div><span style={{ color: "#9CA3AF" }}>Janela:</span> {lead.last_time_window ?? "Qualquer"}</div>
      <div>Requeue: janela diferente amanhã se sem atendimento</div>
    </div>
  );
}

function SOP13Detail({ lead, row }: { lead: Lead; row: SopRow }) {
  return (
    <div className="mt-2 space-y-1 text-[11px]" style={{ color: "#6B7280" }}>
      {row.status === "Concluído" ? (
        <>
          <div><span style={{ color: "#9CA3AF" }}>Confiança:</span> <strong style={{ color: "#16a34a" }}>{lead.dm_direct_phone_confidence}%</strong></div>
          <div><span style={{ color: "#9CA3AF" }}>Tipo de rota:</span> {lead.dm_direct_phone_type === "direct_mobile" ? "Celular Direto" : lead.dm_direct_phone_type === "likely_mobile" ? "Provável Celular" : lead.dm_direct_phone_type === "office_direct" ? "Ramal Direto" : "Via Assistente"}</div>
        </>
      ) : (
        <div>Aguardando acionamento para busca de contato direto.</div>
      )}
    </div>
  );
}

function SopRowItem({ row, lead }: { row: SopRow; lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_STYLE[row.status] ?? STATUS_STYLE["Pendente"];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: row.enhanced && row.status !== "Pendente" ? "rgba(158,63,253,0.04)" : "#FFFFFF",
        border: row.enhanced && row.status !== "Pendente" ? "1px solid rgba(158,63,253,0.15)" : "1px solid #E8EAED",
      }}
    >
      <button
        className="flex items-start gap-2 w-full p-2.5 text-left"
        onClick={() => row.enhanced && setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] shrink-0 font-mono" style={{ color: "#9CA3AF" }}>{row.id}</span>
              <span className="text-xs font-medium truncate" style={{ color: "#374151" }}>{row.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
              >
                {row.status}
              </span>
              {row.enhanced && (
                expanded
                  ? <ChevronUp size={11} style={{ color: "#9CA3AF" }} />
                  : <ChevronDown size={11} style={{ color: "#9CA3AF" }} />
              )}
            </div>
          </div>
          {row.outputSummary
            ? <div className="text-[11px]" style={{ color: "#6B7280" }}>{row.outputSummary}</div>
            : <div className="text-[11px]" style={{ color: "#9CA3AF" }}>{row.description}</div>}
          {row.lastRun && <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{row.lastRun}</div>}
        </div>
      </button>

      <AnimatePresence>
        {expanded && row.enhanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2.5 pb-2.5"
          >
            {row.id === "SOP-01" && <SOP01Detail lead={lead} />}
            {row.id === "SOP-03" && <SOP03Detail lead={lead} />}
            {row.id === "SOP-07" && <SOP07Detail lead={lead} />}
            {row.id === "SOP-13" && <SOP13Detail lead={lead} row={row} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props { lead: Lead }

export function SOPAgentPanel({ lead }: Props) {
  const [showAll, setShowAll] = useState(false);
  const rows = buildRows(lead);
  const activeRows = rows.filter(r => r.status !== "Pendente");
  const pendingRows = rows.filter(r => r.status === "Pendente");

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8EAED", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#E8EAED" }}>
        <Zap size={14} style={{ color: "#9e3ffd" }} />
        <span className="font-semibold text-sm" style={{ color: "#16163f" }}>SOP Agents</span>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}
        >
          {activeRows.length} ativos
        </span>
      </div>

      <div className="p-3 space-y-1.5">
        {activeRows.map(row => <SopRowItem key={row.id} row={row} lead={lead} />)}

        {pendingRows.length > 0 && (
          <>
            <button
              onClick={() => setShowAll(v => !v)}
              className="flex items-center gap-1.5 text-[11px] w-full py-1 font-medium"
              style={{ color: "#9CA3AF" }}
            >
              {showAll ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showAll ? "Ocultar" : `Ver ${pendingRows.length} SOPs pendentes`}
            </button>
            <AnimatePresence>
              {showAll && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5">
                  {pendingRows.map(row => <SopRowItem key={row.id} row={row} lead={lead} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
