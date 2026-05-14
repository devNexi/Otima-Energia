import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, CheckCircle, Zap, BarChart2, FileText, ArrowRight, Shield, X } from "lucide-react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const formSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  empresa: z.string().min(2, "Empresa obrigatória"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone obrigatório"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  estado: z.string().min(2, "Estado obrigatório"),
  valorConta: z.string().min(1, "Valor da conta obrigatório"),
  tipoImovel: z.enum(["Empresa","Comércio","Indústria","Condomínio","Outro"]),
  mensagem: z.string().optional(),
  honeypot: z.string().max(0, "Bot detected"),
});

type FormValues = z.infer<typeof formSchema>;

function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_term: params.get("utm_term") || "",
    utm_content: params.get("utm_content") || "",
    gclid: params.get("gclid") || "",
    gbraid: params.get("gbraid") || "",
    wbraid: params.get("wbraid") || "",
  };
}

function fireEvent(eventName: string, params?: Record<string, any>) {
  try {
    if (window.gtag) {
      window.gtag("event", eventName, params || {});
    } else if (window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch {}
}

export default function Reduza() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formStarted, setFormStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handleFormFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      fireEvent("lead_form_start");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type)) {
      setSubmitError("Arquivo inválido. Envie PDF, JPG ou PNG.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setSubmitError("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    setFile(f);
    setSubmitError(null);
    fireEvent("bill_upload_added", { file_type: f.type });
  };

  const onSubmit = async (data: FormValues) => {
    if (data.honeypot) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const utms = getUTMParams();
      const formData = new FormData();

      Object.entries(data).forEach(([k, v]) => {
        if (k !== "honeypot" && v !== undefined) formData.append(k, v);
      });
      Object.entries(utms).forEach(([k, v]) => formData.append(k, v));
      formData.append("landingPageUrl", window.location.href);
      formData.append("referrer", document.referrer);
      formData.append("userAgent", navigator.userAgent);
      if (file) formData.append("bill", file);

      const res = await fetch("/api/landing/submit", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Erro ao enviar formulário");
      }

      fireEvent("lead_form_submit", {
        lead_id: result.leadId,
        empresa: data.empresa,
        valor_conta: data.valorConta,
        tipo_imovel: data.tipoImovel,
        estado: data.estado,
      });

      setLocation("/obrigado");
    } catch (err: any) {
      setSubmitError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600" />
            <span className="font-bold text-lg text-gray-900">Ótima Energia</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#16163f] to-[#2a1a5e] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-full px-4 py-1.5 text-sm text-purple-200 mb-6">
            <Shield className="h-3.5 w-3.5" />
            Auditoria gratuita. Sem compromisso.
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Reduza a Conta de Energia<br className="hidden md:block" /> da Sua Empresa
          </h1>
          <p className="text-lg md:text-xl text-purple-100 mb-4 max-w-2xl mx-auto">
            Envie sua última conta de luz e receba uma análise gratuita de economia feita por um especialista da Ótima Energia.
          </p>
          <p className="text-purple-200 text-sm max-w-xl mx-auto">
            Sem compromisso. Sem obra. Sem instalação de placas solares. Apenas uma avaliação clara para descobrir se sua empresa pode economizar.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 px-4 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-8">Como funciona</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Upload className="h-6 w-6" />, text: "Você envia sua última conta de energia" },
              { icon: <BarChart2 className="h-6 w-6" />, text: "Nossa equipe analisa seu perfil de consumo" },
              { icon: <FileText className="h-6 w-6" />, text: "Um Especialista envia sua auditoria gratuita" },
              { icon: <CheckCircle className="h-6 w-6" />, text: "Se houver oportunidade, mostramos quanto você economiza" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  {step.icon}
                </div>
                <div className="flex items-center gap-1 text-purple-600 font-bold text-sm">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitar Auditoria Gratuita</h2>
            <p className="text-gray-500 text-sm mb-8">Preencha os campos abaixo e nossa equipe entrará em contato.</p>

            <form onSubmit={handleSubmit(onSubmit)} onFocus={handleFormFocus} noValidate>
              {/* Honeypot - hidden from humans */}
              <input
                type="text"
                {...register("honeypot")}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    {...register("nome")}
                    placeholder="Seu nome completo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="input-nome"
                  />
                  {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
                  <input
                    {...register("empresa")}
                    placeholder="Nome da empresa"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="input-empresa"
                  />
                  {errors.empresa && <p className="text-red-500 text-xs mt-1">{errors.empresa.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="seu@email.com.br"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="input-email"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    {...register("phone")}
                    placeholder="(11) 99999-9999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="input-phone"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                  <input
                    {...register("cidade")}
                    placeholder="Sua cidade"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="input-cidade"
                  />
                  {errors.cidade && <p className="text-red-500 text-xs mt-1">{errors.cidade.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    {...register("estado")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    data-testid="select-estado"
                  >
                    <option value="">Selecione</option>
                    {ESTADOS_BR.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {errors.estado && <p className="text-red-500 text-xs mt-1">{errors.estado.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor médio da conta *</label>
                  <input
                    {...register("valorConta")}
                    placeholder="Ex: R$ 5.000/mês"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="input-valor-conta"
                  />
                  {errors.valorConta && <p className="text-red-500 text-xs mt-1">{errors.valorConta.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de imóvel *</label>
                  <select
                    {...register("tipoImovel")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    data-testid="select-tipo-imovel"
                  >
                    <option value="">Selecione</option>
                    {["Empresa","Comércio","Indústria","Condomínio","Outro"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.tipoImovel && <p className="text-red-500 text-xs mt-1">{errors.tipoImovel.message}</p>}
                </div>
              </div>

              {/* Bill upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta de energia <span className="text-gray-400 font-normal">(opcional, mas acelera a análise)</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-zone"
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setFile(null); }}
                        className="text-gray-400 hover:text-red-500 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Clique para selecionar sua conta</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG · máx. 10 MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-file"
                />
                <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
                  <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                  Sua conta será usada exclusivamente para preparar sua auditoria de economia. Não compartilhamos seus dados.
                </p>
              </div>

              {/* Mensagem */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem / observações <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  {...register("mensagem")}
                  rows={3}
                  placeholder="Alguma informação adicional que queira compartilhar..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  data-testid="input-mensagem"
                />
              </div>

              {submitError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="submit-error">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold py-3.5 px-6 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <>Enviar Minha Conta de Energia <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
            </form>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Dados protegidos</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Sem compromisso</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Resposta em 24h úteis</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Ótima Energia · 
        <a href="/privacidade" className="ml-1 hover:text-purple-600">Política de Privacidade</a>
      </footer>
    </div>
  );
}
