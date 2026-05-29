import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, ArrowLeft, Upload, X, FileText, CheckCircle, Shield, Loader2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre (AC)" },
  { value: "AL", label: "Alagoas (AL)" },
  { value: "AP", label: "Amapá (AP)" },
  { value: "AM", label: "Amazonas (AM)" },
  { value: "BA", label: "Bahia (BA)" },
  { value: "CE", label: "Ceará (CE)" },
  { value: "DF", label: "Distrito Federal (DF)" },
  { value: "ES", label: "Espírito Santo (ES)" },
  { value: "GO", label: "Goiás (GO)" },
  { value: "MA", label: "Maranhão (MA)" },
  { value: "MT", label: "Mato Grosso (MT)" },
  { value: "MS", label: "Mato Grosso do Sul (MS)" },
  { value: "MG", label: "Minas Gerais (MG)" },
  { value: "PA", label: "Pará (PA)" },
  { value: "PB", label: "Paraíba (PB)" },
  { value: "PR", label: "Paraná (PR)" },
  { value: "PE", label: "Pernambuco (PE)" },
  { value: "PI", label: "Piauí (PI)" },
  { value: "RJ", label: "Rio de Janeiro (RJ)" },
  { value: "RN", label: "Rio Grande do Norte (RN)" },
  { value: "RS", label: "Rio Grande do Sul (RS)" },
  { value: "RO", label: "Rondônia (RO)" },
  { value: "RR", label: "Roraima (RR)" },
  { value: "SC", label: "Santa Catarina (SC)" },
  { value: "SP", label: "São Paulo (SP)" },
  { value: "SE", label: "Sergipe (SE)" },
  { value: "TO", label: "Tocantins (TO)" },
];

const BUSINESS_TYPES = [
  "Escola / Colégio",
  "Hotel / Pousada",
  "Supermercado / Mercado",
  "Shopping Center",
  "Restaurante",
  "Indústria",
  "Outro (especificar em mensagem)",
];

const STORAGE_KEY = "otima_diagnostico_draft";

const step1Schema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  company: z.string().min(2, "Nome da empresa é obrigatório"),
  businessType: z.string().min(1, "Selecione o tipo de negócio"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(1, "Selecione o estado"),
  distributor: z.string().min(1, "Selecione a distribuidora"),
});

const step2Schema = z.object({
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
});

const fullSchema = step1Schema.merge(step2Schema).extend({
  lgpdConsent: z.literal(true, { errorMap: () => ({ message: "Consentimento LGPD é obrigatório" }) }),
});

type FormValues = z.infer<typeof fullSchema>;

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

function FieldTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3.5 h-3.5 text-white/30 inline ml-1 cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

const inputClass = "h-12 border-white/10 focus:border-[#9e3ffd] focus:ring-0 text-white placeholder:text-white/30";
const inputStyle = { background: "rgba(255,255,255,0.1)" };

export default function DiagnosticoForm() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(step === 1 ? step1Schema : step === 2 ? step2Schema : fullSchema),
    defaultValues: {
      name: "", company: "", businessType: "", city: "", state: "", distributor: "",
      email: "", phone: "", lgpdConsent: undefined as any,
    },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, val]) => {
          if (val && key !== "lgpdConsent") form.setValue(key as any, val as string);
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        const { lgpdConsent, ...rest } = values;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      } catch {}
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const filledFields = (() => {
    const vals = form.watch();
    const fields = ["name","company","businessType","city","state","distributor","email"];
    const filled = fields.filter(f => !!(vals as any)[f]).length;
    const fileBonus = files.length > 0 ? 1 : 0;
    return Math.round(((filled + fileBonus) / (fields.length + 1)) * 100);
  })();

  const submitDiagnostico = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("company", data.company);
      formData.append("businessType", data.businessType);
      formData.append("city", data.city);
      formData.append("state", data.state);
      formData.append("distributor", data.distributor);
      formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      formData.append("lgpdConsent", "true");
      files.forEach(f => formData.append("bills", f));

      const response = await fetch("/api/diagnostico", { method: "POST", body: formData });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Falha ao enviar");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      localStorage.removeItem(STORAGE_KEY);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    },
  });

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 10 * 1024 * 1024;
    const valid: File[] = [];

    Array.from(newFiles).forEach(f => {
      if (!allowed.includes(f.type)) {
        toast({ title: "Formato inválido", description: `${f.name}: Apenas PDF, JPG e PNG.`, variant: "destructive" });
        return;
      }
      if (f.size > maxSize) {
        toast({ title: "Arquivo grande demais", description: `${f.name}: Máximo 10MB.`, variant: "destructive" });
        return;
      }
      valid.push(f);
    });

    setFiles(prev => {
      const combined = [...prev, ...valid];
      if (combined.length > 3) {
        toast({ title: "Máximo 3 arquivos", description: "Selecione até 3 contas de luz.", variant: "destructive" });
        return combined.slice(0, 3);
      }
      return combined;
    });
  }, [toast]);

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const goNext = async () => {
    const fieldsToValidate: (keyof FormValues)[] = step === 1
      ? ["name","company","businessType","city","state","distributor"]
      : ["email"];
    const valid = await form.trigger(fieldsToValidate);
    if (valid) setStep(s => s + 1);
  };

  const handleSubmit = (values: FormValues) => {
    if (files.length === 0) {
      toast({ title: "Contas obrigatórias", description: "Envie pelo menos 1 conta de luz.", variant: "destructive" });
      return;
    }
    submitDiagnostico.mutate(values);
  };

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: "#09081e" }}>
        <Navbar />
        <section className="bg-[#13112a] pt-32 pb-24 lg:pt-40 lg:pb-32">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="w-20 h-20 bg-[#9e3ffd] rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-normal tracking-tight text-white mb-6" data-testid="text-success-title">
              Recebemos suas contas!
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              Em até 5 dias úteis você recebe um diagnóstico completo no seu e-mail com a economia projetada para sua empresa.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] font-medium transition-colors"
              data-testid="link-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao site
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#09081e" }}>
      <Navbar />

      <section className="bg-[#13112a] pt-32 pb-12 lg:pt-40 lg:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[#9e3ffd] uppercase tracking-wider mb-4">
              Diagnóstico Gratuito
            </p>
            <h1 className="text-[2rem] lg:text-[2.75rem] leading-[1.15] font-normal tracking-tight text-white mb-4" data-testid="text-form-title">
              Diagnóstico Gratuito de Economia de Energia
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Descubra quanto seu negócio pode economizar na conta de luz. Pré-requisito: envio das últimas 3 contas em PDF.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#09081e] py-12 lg:py-16 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="rounded-lg p-6 mb-10 border-l-4 border-[#00A86B]" style={{ background: "rgba(0,168,107,0.08)", borderRadius: "0 8px 8px 0" }} data-testid="eligibility-notice">
            <p className="font-bold text-white mb-2">Antes de enviar:</p>
            <p className="text-sm text-white/60 mb-3">A economia via GDL depende da sua distribuidora, região e perfil de consumo. Este é um <strong className="text-white">diagnóstico gratuito</strong> — vamos analisar seus dados e verificar:</p>
            <ul className="text-sm text-white/60 space-y-1.5 mb-3 ml-1">
              <li>Se sua região possui usinas disponíveis (hoje ou no futuro)</li>
              <li>Se seu perfil de consumo é compatível</li>
              <li>Qual a economia estimada (se elegível)</li>
            </ul>
            <p className="text-sm text-white font-medium">Se você for elegível, apresentamos propostas reais das nossas comercializadoras parceiras. Se não for hoje, avisamos e mantemos contato para quando houver oferta na sua região.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-8">
                {[1,2,3].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s ? "bg-[#9e3ffd] text-white" : "text-white/40"
                    }`} style={{ background: step >= s ? "#9e3ffd" : "rgba(255,255,255,0.1)" }} data-testid={`step-indicator-${s}`}>
                      {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                    </div>
                    <span className={`text-sm hidden sm:inline ${step >= s ? "text-white font-medium" : "text-white/30"}`}>
                      {s === 1 ? "Dados" : s === 2 ? "Contato" : "Contas"}
                    </span>
                    {s < 3 && <div className={`w-8 h-px ${step > s ? "bg-[#9e3ffd]" : "bg-white/10"}`} />}
                  </div>
                ))}
                <span className="ml-auto text-xs text-white/40">{filledFields}% preenchido</span>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                  {step === 1 && (
                    <div className="space-y-5" data-testid="step-1-fields">
                      <div className="grid md:grid-cols-2 gap-5">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-white/80">
                              Nome Completo *
                              <FieldTooltip text="Nome do responsável pelo diagnóstico." />
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" className={inputClass} style={inputStyle} data-testid="input-name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="company" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-white/80">
                              Empresa *
                              <FieldTooltip text="Nome da empresa, escola, hotel, etc." />
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da empresa / escola / hotel" className={inputClass} style={inputStyle} data-testid="input-company" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="businessType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-white/80">
                            Tipo de Negócio *
                            <FieldTooltip text="Nos ajuda a comparar seu consumo com empresas similares." />
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className={inputClass} style={inputStyle} data-testid="select-business-type">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BUSINESS_TYPES.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid md:grid-cols-2 gap-5">
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-white/80">Cidade *</FormLabel>
                            <FormControl>
                              <Input placeholder="Sua cidade" className={inputClass} style={inputStyle} data-testid="input-city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="state" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-white/80">Estado *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={inputClass} style={inputStyle} data-testid="select-state">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BRAZILIAN_STATES.map(s => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="distributor" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-white/80">
                            Distribuidora de Energia *
                            <FieldTooltip text="A empresa que aparece na sua conta de luz." />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: CPFL Paulista, Cemig, Copel..." className={inputClass} style={inputStyle} data-testid="input-distributor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="flex justify-end pt-4">
                        <button type="button" onClick={goNext} className="flex items-center gap-2 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-3 font-medium transition-colors" data-testid="button-next-step1">
                          Próximo
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5" data-testid="step-2-fields">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-white/80">
                            E-mail *
                            <FieldTooltip text="Enviaremos o diagnóstico para este e-mail." />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="voce@empresa.com.br" type="email" className={inputClass} style={inputStyle} data-testid="input-email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-white/80">Telefone (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(XX) XXXXX-XXXX"
                              className={inputClass}
                              style={inputStyle}
                              data-testid="input-phone"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 border border-white/20 text-white/80 hover:bg-white/5 px-6 py-3 font-medium transition-colors" data-testid="button-back-step2">
                          <ArrowLeft className="w-4 h-4" />
                          Voltar
                        </button>
                        <button type="button" onClick={goNext} className="flex items-center gap-2 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-3 font-medium transition-colors" data-testid="button-next-step2">
                          Próximo
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6" data-testid="step-3-fields">
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">
                          Upload das 3 Últimas Contas de Luz *
                          <FieldTooltip text="Precisamos das contas para calcular seu perfil de consumo real." />
                        </label>
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                            isDragging ? "border-[#9e3ffd]" : "border-white/20 hover:border-[#9e3ffd]"
                          }`}
                          style={{ background: isDragging ? "rgba(158,63,253,0.08)" : "rgba(255,255,255,0.06)" }}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById("file-input")?.click()}
                          data-testid="dropzone-bills"
                        >
                          <Upload className="w-8 h-8 text-[#9e3ffd] mx-auto mb-3" />
                          <p className="text-white font-medium mb-1">Arraste os arquivos ou clique para selecionar</p>
                          <p className="text-sm text-white/40">PDF, JPG ou PNG. Máximo 10MB cada. Até 3 arquivos.</p>
                          <input
                            id="file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleFiles(e.target.files)}
                            data-testid="input-file-upload"
                          />
                        </div>

                        {files.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {files.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3 border border-white/[0.18]" style={{ background: "rgba(158,63,253,0.08)" }} data-testid={`file-item-${i}`}>
                                <FileText className="w-5 h-5 text-[#9e3ffd] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{f.name}</p>
                                  <p className="text-xs text-white/40">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button type="button" onClick={() => removeFile(i)} className="text-white/30 hover:text-red-400 transition-colors" data-testid={`button-remove-file-${i}`}>
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <FormField control={form.control} name="lgpdConsent" render={({ field }) => (
                        <FormItem className="flex items-start gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                              data-testid="checkbox-lgpd"
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="text-sm text-white/60 font-normal leading-relaxed cursor-pointer">
                              Concordo em compartilhar meus dados para receber o diagnóstico gratuito. <Link href="/privacidade" className="text-[#9e3ffd] hover:underline">Política de Privacidade</Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )} />

                      <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 border border-white/20 text-white/80 hover:bg-white/5 px-6 py-3 font-medium transition-colors" data-testid="button-back-step3">
                          <ArrowLeft className="w-4 h-4" />
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-3 font-medium transition-colors disabled:opacity-60"
                          disabled={submitDiagnostico.isPending}
                          data-testid="button-submit-diagnostico"
                        >
                          {submitDiagnostico.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
                          ) : (
                            <>Enviar Diagnóstico<ArrowRight className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </div>

            <div className="space-y-8">
              <div className="rounded-lg p-6 border border-white/[0.18]" style={{ background: "rgba(255,255,255,0.1)" }}>
                <h3 className="text-lg font-medium text-white mb-4">Como funciona</h3>
                <div className="space-y-4">
                  {[
                    { n: "1", title: "Envie seus dados e contas", desc: "Preenchemos seu perfil de consumo." },
                    { n: "2", title: "Análise nos 3 mercados", desc: "ACR, ACL e GDL comparados." },
                    { n: "3", title: "Diagnóstico no e-mail", desc: "Em até 5 dias úteis, com economia projetada e próximos passos." },
                  ].map(item => (
                    <div key={item.n} className="flex gap-3">
                      <div className="w-7 h-7 bg-[#9e3ffd] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                        {item.n}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-white/50">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#9e3ffd]" />
                  100% gratuito
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#9e3ffd]" />
                  Sem compromisso
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#9e3ffd]" />
                  Dados protegidos (LGPD)
                </span>
              </div>

              <div className="rounded-lg p-6 border border-[#9e3ffd]/20" style={{ background: "rgba(158,63,253,0.08)" }}>
                <p className="text-2xl font-light text-[#9e3ffd] mb-1">5 dias úteis</p>
                <p className="text-sm text-white/50">Prazo médio para receber seu diagnóstico completo</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-5 mt-10 border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.06)" }} data-testid="future-expansion-notice">
            <p className="text-sm text-white/50">
              <strong className="text-white/80">Expandindo parcerias:</strong> Atualmente temos parceria prioritária com a Prime Energy (Grupo Shell) nas distribuidoras destacadas. Estamos constantemente adicionando novas comercializadoras parceiras em todas as regiões do Brasil. Mesmo que sua distribuidora não esteja na lista hoje, envie seus dados — analisamos com outros fornecedores e, se não houver oferta agora, avisamos quando surgir oportunidade.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
