interface EcosPdfData {
  companyName: string;
  ucCode: string | null;
  submarket: string | null;
  snapshotDate: string;
  snapshotVersion: number;
  status: string;
  clientBand: ClientBand;
  estimatedPriceRmwh: number | null;
  avgMonthlyKwh: number | null;
  annualConsumptionMwh: number | null;
  billCount: number;
  prcReferenceMonth: string | null;
  eligibility: string | null;
  confidenceLevel: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  darkColor: string;
  lightBgColor: string;
  textColor: string;
  logoBase64: string | null;
  footerText: string;
}

type ClientBand = 'WELL_BELOW' | 'BELOW' | 'ON_PAR' | 'ABOVE' | 'WELL_ABOVE' | 'INSUFFICIENT_DATA';

interface BandConfig {
  label: string;
  badge: string;
  color: string;
  bgColor: string;
  insight: string;
  cta: string;
}

const BAND_CONFIG: Record<ClientBand, BandConfig> = {
  WELL_BELOW: {
    label: 'Bem abaixo do mercado',
    badge: 'BEM ABAIXO',
    color: '#047857',
    bgColor: '#d1fae5',
    insight: 'Você parece estar em uma posição sólida hoje. Não recomendamos pressa para trocar. Ainda assim, podemos checar oportunidades sem custo e confirmar se existe upside escondido.',
    cta: 'Revisão rápida para validação + monitoramento.',
  },
  BELOW: {
    label: 'Abaixo do mercado',
    badge: 'ABAIXO',
    color: '#059669',
    bgColor: '#d1fae5',
    insight: 'Sua tarifa atual está posicionada de forma competitiva. Recomendamos manter o monitoramento e revisar antes do próximo ciclo contratual para garantir que essa vantagem se mantenha.',
    cta: 'Revisão rápida para validação + monitoramento.',
  },
  ON_PAR: {
    label: 'Na faixa de mercado',
    badge: 'NA FAIXA',
    color: '#0369a1',
    bgColor: '#dbeafe',
    insight: 'Você está próximo do padrão de mercado. Uma cotação rápida pode revelar melhorias pequenas (estrutura/risco) — vale avaliar opções antes do próximo ciclo.',
    cta: 'Rodar cotação exploratória para mapear cenários alternativos.',
  },
  ABOVE: {
    label: 'Acima do mercado',
    badge: 'ACIMA',
    color: '#c2410c',
    bgColor: '#fed7aa',
    insight: 'Você provavelmente está pagando acima do mercado para seu perfil. Há boa chance de capturar economia com ajuste de estrutura/fornecedor. Recomendamos iniciar cotação e mapear cenários.',
    cta: 'Rodar RFQ com 3–5 fornecedores e simular cenários.',
  },
  WELL_ABOVE: {
    label: 'Bem acima do mercado',
    badge: 'BEM ACIMA',
    color: '#b91c1c',
    bgColor: '#fecaca',
    insight: 'Os dados indicam que sua tarifa está significativamente acima da faixa praticada no mercado. Existe um potencial relevante de economia que merece ação imediata.',
    cta: 'Iniciar RFQ urgente com fornecedores qualificados. Simular cenários de migração.',
  },
  INSUFFICIENT_DATA: {
    label: 'Dados insuficientes',
    badge: 'EM ANÁLISE',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    insight: 'Ainda não temos dados suficientes para uma conclusão definitiva — mas já dá para indicar uma tendência inicial. Com mais informações, a análise ficará mais precisa.',
    cta: 'Enviar mais faturas ou confirmar código da UC e preço contratual.',
  },
};

export function computeClientBand(
  estimatedPriceRmwh: number | null,
  prcAvgPrice: number | null,
  billCount: number,
  avgMonthlyKwh: number | null,
): ClientBand {
  if (
    !estimatedPriceRmwh ||
    estimatedPriceRmwh <= 0 ||
    !prcAvgPrice ||
    prcAvgPrice <= 0 ||
    billCount < 1 ||
    !avgMonthlyKwh ||
    avgMonthlyKwh <= 0
  ) {
    return 'INSUFFICIENT_DATA';
  }

  const ratio = estimatedPriceRmwh / prcAvgPrice;
  // Thresholds: <=0.90 well below, 0.90-0.97 below, 0.97-1.03 on par, 1.03-1.10 above, >1.10 well above

  if (ratio <= 0.90) return 'WELL_BELOW';
  if (ratio <= 0.97) return 'BELOW';
  if (ratio <= 1.03) return 'ON_PAR';
  if (ratio <= 1.10) return 'ABOVE';
  return 'WELL_ABOVE';
}

export function legacyStatusToClientBand(status: string): ClientBand {
  switch (status) {
    case 'BELOW_BAND': return 'BELOW';
    case 'WITHIN_BAND': return 'ON_PAR';
    case 'ABOVE_BAND': return 'ABOVE';
    default: return 'INSUFFICIENT_DATA';
  }
}

function bandToPosition(band: ClientBand): number {
  switch (band) {
    case 'WELL_BELOW': return 10;
    case 'BELOW': return 25;
    case 'ON_PAR': return 50;
    case 'ABOVE': return 75;
    case 'WELL_ABOVE': return 90;
    case 'INSUFFICIENT_DATA': return -1;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNumber(n: number | null | undefined, decimals = 0): string {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function generateEcosClientHtml(data: EcosPdfData): string {
  const band = data.clientBand;
  const config = BAND_CONFIG[band];
  const pos = bandToPosition(band);
  const hasClientMarker = pos >= 0;

  const submarketLabel = data.submarket ? data.submarket.replace('_', '/') : '—';
  const prcLabel = data.prcReferenceMonth
    ? `${submarketLabel} • ${data.prcReferenceMonth}`
    : submarketLabel;

  const consumptionSummary = data.avgMonthlyKwh && data.avgMonthlyKwh > 0
    ? `${formatNumber(data.avgMonthlyKwh)} kWh/mês • ${formatNumber(data.annualConsumptionMwh, 1)} MWh/ano`
    : null;

  const logoHtml = data.logoBase64
    ? `<img src="data:image/png;base64,${data.logoBase64}" alt="${escapeHtml(data.brandName)}" style="height: 40px; object-fit: contain;" />`
    : `<span style="font-size: 20px; font-weight: 700; color: white; letter-spacing: 1px;">${escapeHtml(data.brandName)}</span>`;

  const billLabel = data.billCount === 1
    ? '1 fatura analisada'
    : `${data.billCount} faturas analisadas`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: ${data.darkColor};
    background: #ffffff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .header {
    background: linear-gradient(135deg, ${data.primaryColor}, ${data.secondaryColor});
    padding: 36px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left { display: flex; flex-direction: column; gap: 6px; }
  .header-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.85);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .header-company {
    font-size: 22px;
    font-weight: 700;
    color: white;
    margin-top: 4px;
  }
  .header-meta {
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    margin-top: 2px;
  }

  .content { padding: 36px 48px; flex: 1; }

  .section { margin-bottom: 32px; }
  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${data.primaryColor};
    margin-bottom: 12px;
  }

  .exec-summary {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    border-radius: 12px;
    background: ${config.bgColor};
    border: 1px solid ${config.color}22;
  }
  .exec-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 16px;
    border-radius: 20px;
    background: ${config.color};
    color: white;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .exec-text {
    font-size: 14px;
    color: ${data.darkColor};
    line-height: 1.5;
  }

  .chart-container {
    padding: 24px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }
  .chart-label-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .chart-label-item {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #9ca3af;
    text-align: center;
    width: 20%;
  }
  .band-bar {
    position: relative;
    height: 40px;
    border-radius: 8px;
    overflow: visible;
    display: flex;
  }
  .band-segment {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .band-segment:first-child { border-radius: 8px 0 0 8px; }
  .band-segment:last-child { border-radius: 0 8px 8px 0; }

  .marker-container {
    position: absolute;
    top: -28px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
  }
  .marker-label {
    font-size: 10px;
    font-weight: 700;
    color: ${data.darkColor};
    background: white;
    padding: 2px 8px;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    white-space: nowrap;
    margin-bottom: 4px;
  }
  .marker-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${data.darkColor};
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  }
  .marker-line {
    width: 2px;
    height: 14px;
    background: ${data.darkColor};
  }

  .chart-footer {
    display: flex;
    justify-content: center;
    margin-top: 12px;
    gap: 6px;
  }
  .chart-footer-tag {
    font-size: 10px;
    color: #6b7280;
    background: #e5e7eb;
    padding: 3px 10px;
    border-radius: 10px;
    font-weight: 500;
  }

  .insight-box {
    padding: 20px 24px;
    border-radius: 12px;
    background: #fefce8;
    border: 1px solid #fde68a;
  }
  .insight-title {
    font-size: 13px;
    font-weight: 700;
    color: #92400e;
    margin-bottom: 8px;
  }
  .insight-text {
    font-size: 13px;
    line-height: 1.6;
    color: #78350f;
  }

  .cta-box {
    padding: 20px 24px;
    border-radius: 12px;
    background: linear-gradient(135deg, ${data.primaryColor}12, ${data.secondaryColor}12);
    border: 1px solid ${data.primaryColor}33;
  }
  .cta-label {
    font-size: 12px;
    font-weight: 700;
    color: ${data.primaryColor};
    margin-bottom: 6px;
  }
  .cta-text {
    font-size: 13px;
    color: ${data.darkColor};
    line-height: 1.5;
  }
  .cta-brand {
    font-size: 12px;
    color: ${data.primaryColor};
    font-weight: 600;
    margin-top: 10px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .stat-card {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
  }
  .stat-label {
    font-size: 10px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .stat-value {
    font-size: 18px;
    font-weight: 700;
    color: ${data.darkColor};
  }

  .footer {
    padding: 20px 48px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left {
    font-size: 9px;
    color: #9ca3af;
    line-height: 1.5;
  }
  .footer-right {
    font-size: 8px;
    color: #d1d5db;
    text-align: right;
    line-height: 1.4;
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-title">ECOS&trade; Insight Snapshot</div>
      <div class="header-company">${escapeHtml(data.companyName)}</div>
      <div class="header-meta">
        ${data.ucCode ? `UC ${escapeHtml(data.ucCode)} &bull; ` : ''}${escapeHtml(data.snapshotDate)}${data.submarket ? ` &bull; ${escapeHtml(submarketLabel)}` : ''}
      </div>
    </div>
    <div>${logoHtml}</div>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-label">Resumo Executivo</div>
      <div class="exec-summary">
        <div class="exec-badge">${escapeHtml(config.badge)}</div>
        <div class="exec-text">
          ${band === 'INSUFFICIENT_DATA'
            ? 'Ainda não temos dados suficientes para uma conclusão definitiva — mas já dá para indicar uma tendência inicial.'
            : band === 'WELL_BELOW' || band === 'BELOW'
              ? 'Pelos dados atuais, sua tarifa aparenta estar <strong>abaixo</strong> da faixa de mercado para seu perfil.'
              : band === 'ON_PAR'
                ? 'Pelos dados atuais, sua tarifa aparenta estar <strong>dentro</strong> da faixa de mercado para seu perfil.'
                : 'Pelos dados atuais, sua tarifa aparenta estar <strong>acima</strong> da faixa de mercado para seu perfil.'}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Posição no Mercado</div>
      <div class="chart-container">
        <div class="chart-label-row">
          <div class="chart-label-item">Bem abaixo</div>
          <div class="chart-label-item">Abaixo</div>
          <div class="chart-label-item">Na faixa</div>
          <div class="chart-label-item">Acima</div>
          <div class="chart-label-item">Bem acima</div>
        </div>
        <div class="band-bar">
          <div class="band-segment" style="width: 20%; background: #d1fae5;"></div>
          <div class="band-segment" style="width: 20%; background: #a7f3d0;"></div>
          <div class="band-segment" style="width: 20%; background: #dbeafe;"></div>
          <div class="band-segment" style="width: 20%; background: #fed7aa;"></div>
          <div class="band-segment" style="width: 20%; background: #fecaca;"></div>
          ${hasClientMarker ? `
          <div class="marker-container" style="left: ${pos}%;">
            <div class="marker-label">Você</div>
            <div class="marker-dot"></div>
            <div class="marker-line"></div>
          </div>
          ` : ''}
        </div>
        <div class="chart-footer">
          <span class="chart-footer-tag">${escapeHtml(prcLabel)}</span>
          <span class="chart-footer-tag">${billLabel}</span>
        </div>
      </div>
    </div>

    ${consumptionSummary ? `
    <div class="section">
      <div class="section-label">Perfil de Consumo</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Consumo Médio</div>
          <div class="stat-value">${formatNumber(data.avgMonthlyKwh)} <span style="font-size: 12px; font-weight: 400; color: #9ca3af;">kWh/mês</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Consumo Anual</div>
          <div class="stat-value">${formatNumber(data.annualConsumptionMwh, 1)} <span style="font-size: 12px; font-weight: 400; color: #9ca3af;">MWh</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Elegibilidade</div>
          <div class="stat-value" style="font-size: 14px;">${data.eligibility === 'ACL_DIRECT' ? 'Mercado Livre (Direto)' : data.eligibility === 'ACL_VAREJISTA' ? 'Mercado Livre (Varejista)' : 'Em avaliação'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Faturas Analisadas</div>
          <div class="stat-value">${data.billCount}</div>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-label">O que isso significa</div>
      <div class="insight-box">
        <div class="insight-title">Análise para sua unidade</div>
        <div class="insight-text">${escapeHtml(config.insight)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Próximo Passo Recomendado</div>
      <div class="cta-box">
        <div class="cta-label">Recomendação</div>
        <div class="cta-text">${escapeHtml(config.cta)}</div>
        <div class="cta-brand">Se quiser, a ${escapeHtml(data.brandName)} conduz isso ponta a ponta.</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-left">
      ${escapeHtml(data.footerText)}<br>
      Este documento é confidencial e destinado exclusivamente ao cliente identificado.
    </div>
    <div class="footer-right">
      ECOS&trade; Insight Snapshot v${data.snapshotVersion}<br>
      ${escapeHtml(data.snapshotDate)}
    </div>
  </div>
</div>
</body>
</html>`;
}

export { EcosPdfData, ClientBand, BAND_CONFIG };
