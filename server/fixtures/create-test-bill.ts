import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function createTestBillPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 780;
  const draw = (text: string, x: number, size: number, bold = false) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
    y -= size + 4;
  };

  draw('CEMIG DISTRIBUICAO S.A.', 50, 16, true);
  draw('CNPJ: 06.981.180/0001-16', 50, 10);
  y -= 10;

  draw('CONTA DE ENERGIA ELETRICA', 50, 14, true);
  y -= 10;

  draw('Cliente: OTIMA ENERGIA LTDA', 50, 11);
  draw('CNPJ: 12.345.678/0001-90', 50, 11);
  draw('Instalacao: 3004567890', 50, 11);
  draw('Classe: Comercial - Subgrupo A4', 50, 11);
  draw('Grupo Tarifario: A4 Verde', 50, 11);
  y -= 10;

  draw('Referencia: 01/2025', 50, 11);
  draw('Vencimento: 15/02/2025', 50, 11);
  y -= 10;

  draw('RESUMO DA FATURA', 50, 12, true);
  y -= 5;
  draw('Consumo Ponta:           1.250 kWh', 50, 10);
  draw('Consumo Fora Ponta:     12.800 kWh', 50, 10);
  draw('Demanda Medida:            450 kW', 50, 10);
  draw('Demanda Contratada:        500 kW', 50, 10);
  y -= 5;
  draw('Energia Ativa Ponta:    R$   3.125,00', 50, 10);
  draw('Energia Ativa F.Ponta:  R$  12.160,00', 50, 10);
  draw('Demanda:                R$   8.500,00', 50, 10);
  draw('ICMS:                   R$   4.276,35', 50, 10);
  draw('PIS/COFINS:             R$   1.938,65', 50, 10);
  y -= 5;
  draw('TOTAL A PAGAR:          R$  30.000,00', 50, 12, true);
  y -= 10;
  draw('Energia Total: 14.050 kWh', 50, 10);

  y -= 20;
  draw('Chave de Acesso NFe:', 50, 9);
  draw('3125 0212 3456 7800 0190 5500 0000 0123 4567 8901 2345', 50, 8);

  const pdfBytes = await pdfDoc.save();
  const outPath = join(import.meta.dirname, 'test-bill.pdf');
  writeFileSync(outPath, pdfBytes);
  console.log(`Created ${outPath} (${pdfBytes.length} bytes)`);
}

createTestBillPdf().catch(console.error);
