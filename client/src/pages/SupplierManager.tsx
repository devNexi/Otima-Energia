import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MessageCircle, 
  Globe, 
  Star, 
  Clock, 
  User,
  ArrowLeft,
  Languages,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

type SupplierContact = {
  id: number;
  supplierId: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  preferredFormat: string;
  formatDetails: any;
  typicalResponseHours: number;
  bestContactTime: string | null;
  responsivenessScore: number;
  lastContacted: string | null;
  customSubjectTemplate: string | null;
  customBodyTemplate: string | null;
  isActive: boolean;
  isPrimary: boolean;
  notes: string | null;
};

type Supplier = {
  id: number;
  name: string;
  shortCode: string;
  category: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  isActive: boolean;
  contacts?: SupplierContact[];
};

const formatColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  email: { bg: "bg-red-100", text: "text-red-700", icon: <Mail className="h-3 w-3" /> },
  whatsapp: { bg: "bg-green-100", text: "text-green-700", icon: <MessageCircle className="h-3 w-3" /> },
  portal: { bg: "bg-blue-100", text: "text-blue-700", icon: <Globe className="h-3 w-3" /> },
  phone: { bg: "bg-emerald-100", text: "text-emerald-700", icon: <Phone className="h-3 w-3" /> },
};

const categoryLabels: Record<string, string> = {
  large: "Grande",
  medium: "Médio",
  small: "Pequeno",
  renewable: "Renovável",
};

export default function SupplierManager() {
  const { toast } = useToast();
  const { t, language, setLanguage } = useI18n();
  const queryClient = useQueryClient();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SupplierContact | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    preferredFormat: "email",
    formatDetails: {} as any,
    typicalResponseHours: 48,
    bestContactTime: "",
    responsivenessScore: 3,
    customSubjectTemplate: "",
    customBodyTemplate: "",
    isActive: true,
    isPrimary: false,
    notes: ""
  });

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ["/api/suppliers-with-contacts"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers-with-contacts");
      return res.json();
    }
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: { supplierId: number; contact: typeof contactForm }) => {
      const res = await fetch(`/api/suppliers/${data.supplierId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.contact)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers-with-contacts"] });
      setContactDialogOpen(false);
      resetContactForm();
      toast({ title: language === "pt" ? "Contato criado com sucesso!" : "Contact created successfully!" });
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: { supplierId: number; contactId: number; contact: typeof contactForm }) => {
      const res = await fetch(`/api/suppliers/${data.supplierId}/contacts/${data.contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.contact)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers-with-contacts"] });
      setContactDialogOpen(false);
      resetContactForm();
      toast({ title: language === "pt" ? "Contato atualizado!" : "Contact updated!" });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (data: { supplierId: number; contactId: number }) => {
      const res = await fetch(`/api/suppliers/${data.supplierId}/contacts/${data.contactId}`, {
        method: "DELETE"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers-with-contacts"] });
      toast({ title: language === "pt" ? "Contato removido!" : "Contact deleted!" });
    }
  });

  const resetContactForm = () => {
    setContactForm({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      preferredFormat: "email",
      formatDetails: {},
      typicalResponseHours: 48,
      bestContactTime: "",
      responsivenessScore: 3,
      customSubjectTemplate: "",
      customBodyTemplate: "",
      isActive: true,
      isPrimary: false,
      notes: ""
    });
    setEditingContact(null);
  };

  const openAddContact = (supplierId: number) => {
    resetContactForm();
    setSelectedSupplierId(supplierId);
    setContactDialogOpen(true);
  };

  const openEditContact = (supplierId: number, contact: SupplierContact) => {
    setSelectedSupplierId(supplierId);
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
      role: contact.role || "",
      department: contact.department || "",
      preferredFormat: contact.preferredFormat || "email",
      formatDetails: contact.formatDetails || {},
      typicalResponseHours: contact.typicalResponseHours || 48,
      bestContactTime: contact.bestContactTime || "",
      responsivenessScore: contact.responsivenessScore || 3,
      customSubjectTemplate: contact.customSubjectTemplate || "",
      customBodyTemplate: contact.customBodyTemplate || "",
      isActive: contact.isActive,
      isPrimary: contact.isPrimary,
      notes: contact.notes || ""
    });
    setContactDialogOpen(true);
  };

  const handleSaveContact = () => {
    if (!selectedSupplierId) return;
    
    if (editingContact) {
      updateContactMutation.mutate({
        supplierId: selectedSupplierId,
        contactId: editingContact.id,
        contact: contactForm
      });
    } else {
      createContactMutation.mutate({
        supplierId: selectedSupplierId,
        contact: contactForm
      });
    }
  };

  const handleDeleteContact = (supplierId: number, contactId: number) => {
    if (confirm(language === "pt" ? "Tem certeza que deseja excluir este contato?" : "Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate({ supplierId, contactId });
    }
  };

  const suppliers: Supplier[] = suppliersData?.suppliers || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-testid="button-back-admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "pt" ? "Voltar" : "Back"}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                {language === "pt" ? "Gestão de Fornecedores" : "Supplier Management"}
              </h1>
              <p className="text-sm text-gray-500">
                {language === "pt" ? "Gerencie contatos e preferências de comunicação" : "Manage contacts and communication preferences"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
            data-testid="button-language-toggle"
          >
            <Languages className="h-4 w-4 mr-2" />
            {t("language.toggle")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow" data-testid={`card-supplier-${supplier.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <CardTitle className="text-base" data-testid={`text-supplier-name-${supplier.id}`}>
                          {supplier.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {supplier.shortCode}
                          {supplier.category && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {categoryLabels[supplier.category] || supplier.category}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openAddContact(supplier.id)}
                      data-testid={`button-add-contact-${supplier.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {supplier.contacts && supplier.contacts.length > 0 ? (
                    <div className="space-y-3">
                      {supplier.contacts.map((contact) => (
                        <div 
                          key={contact.id} 
                          className={`p-3 rounded-lg border ${contact.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                          data-testid={`card-contact-${contact.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-sm" data-testid={`text-contact-name-${contact.id}`}>
                                {contact.name}
                              </span>
                              {contact.isPrimary && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0"
                                onClick={() => openEditContact(supplier.id, contact)}
                                data-testid={`button-edit-contact-${contact.id}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteContact(supplier.id, contact.id)}
                                data-testid={`button-delete-contact-${contact.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {contact.role && (
                            <p className="text-xs text-gray-500 mb-2">{contact.role}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {contact.preferredFormat && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${formatColors[contact.preferredFormat]?.bg || 'bg-gray-100'} ${formatColors[contact.preferredFormat]?.text || 'text-gray-700'}`}
                                data-testid={`badge-format-${contact.id}`}
                              >
                                {formatColors[contact.preferredFormat]?.icon}
                                <span className="ml-1">
                                  {contact.preferredFormat === 'email' && 'Email'}
                                  {contact.preferredFormat === 'whatsapp' && 'WhatsApp'}
                                  {contact.preferredFormat === 'portal' && 'Portal'}
                                  {contact.preferredFormat === 'phone' && (language === "pt" ? 'Telefone' : 'Phone')}
                                </span>
                              </Badge>
                            )}
                            {contact.typicalResponseHours && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {contact.typicalResponseHours}h
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {contact.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                          
                          {contact.notes && (
                            <p className="text-xs text-gray-400 mt-2 italic line-clamp-2">
                              {contact.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      {language === "pt" ? "Nenhum contato cadastrado" : "No contacts registered"}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContact 
                  ? (language === "pt" ? "Editar Contato" : "Edit Contact")
                  : (language === "pt" ? "Adicionar Contato" : "Add Contact")
                }
              </DialogTitle>
              <DialogDescription>
                {language === "pt" 
                  ? "Configure os dados e preferências de comunicação do contato"
                  : "Configure contact details and communication preferences"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{language === "pt" ? "Nome *" : "Name *"}</Label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder={language === "pt" ? "Nome completo" : "Full name"}
                    data-testid="input-contact-name"
                  />
                </div>
                
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="email@empresa.com"
                    data-testid="input-contact-email"
                  />
                </div>
                
                <div>
                  <Label>{language === "pt" ? "Telefone" : "Phone"}</Label>
                  <Input
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    data-testid="input-contact-phone"
                  />
                </div>
                
                <div>
                  <Label>{language === "pt" ? "Cargo" : "Role"}</Label>
                  <Input
                    value={contactForm.role}
                    onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                    placeholder={language === "pt" ? "Ex: Gerente Comercial" : "Ex: Sales Manager"}
                    data-testid="input-contact-role"
                  />
                </div>
                
                <div>
                  <Label>{language === "pt" ? "Departamento" : "Department"}</Label>
                  <Input
                    value={contactForm.department}
                    onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                    placeholder={language === "pt" ? "Ex: Comercial" : "Ex: Sales"}
                    data-testid="input-contact-department"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-sm">
                  {language === "pt" ? "Preferências de Comunicação" : "Communication Preferences"}
                </h4>
                
                <div>
                  <Label>{language === "pt" ? "Formato Preferido" : "Preferred Format"}</Label>
                  <Select
                    value={contactForm.preferredFormat}
                    onValueChange={(value) => setContactForm({ ...contactForm, preferredFormat: value })}
                  >
                    <SelectTrigger data-testid="select-preferred-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-red-500" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-500" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="portal">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-500" />
                          Portal
                        </div>
                      </SelectItem>
                      <SelectItem value="phone">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-emerald-500" />
                          {language === "pt" ? "Telefone" : "Phone"}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {contactForm.preferredFormat === "whatsapp" && (
                  <div>
                    <Label>{language === "pt" ? "Número WhatsApp" : "WhatsApp Number"}</Label>
                    <Input
                      value={contactForm.formatDetails?.whatsappNumber || ""}
                      onChange={(e) => setContactForm({ 
                        ...contactForm, 
                        formatDetails: { ...contactForm.formatDetails, whatsappNumber: e.target.value }
                      })}
                      placeholder="+55 11 99999-9999"
                      data-testid="input-whatsapp-number"
                    />
                  </div>
                )}

                {contactForm.preferredFormat === "portal" && (
                  <div>
                    <Label>{language === "pt" ? "URL do Portal" : "Portal URL"}</Label>
                    <Input
                      value={contactForm.formatDetails?.portalUrl || ""}
                      onChange={(e) => setContactForm({ 
                        ...contactForm, 
                        formatDetails: { ...contactForm.formatDetails, portalUrl: e.target.value }
                      })}
                      placeholder="https://portal.fornecedor.com.br"
                      data-testid="input-portal-url"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === "pt" ? "Tempo de Resposta (horas)" : "Response Time (hours)"}</Label>
                    <Input
                      type="number"
                      value={contactForm.typicalResponseHours}
                      onChange={(e) => setContactForm({ ...contactForm, typicalResponseHours: parseInt(e.target.value) || 48 })}
                      data-testid="input-response-hours"
                    />
                  </div>
                  
                  <div>
                    <Label>{language === "pt" ? "Melhor Horário" : "Best Contact Time"}</Label>
                    <Input
                      value={contactForm.bestContactTime}
                      onChange={(e) => setContactForm({ ...contactForm, bestContactTime: e.target.value })}
                      placeholder={language === "pt" ? "Ex: 9-12h" : "Ex: 9am-12pm"}
                      data-testid="input-best-time"
                    />
                  </div>
                </div>

                <div>
                  <Label>{language === "pt" ? "Score de Responsividade (1-5)" : "Responsiveness Score (1-5)"}</Label>
                  <Select
                    value={contactForm.responsivenessScore.toString()}
                    onValueChange={(value) => setContactForm({ ...contactForm, responsivenessScore: parseInt(value) })}
                  >
                    <SelectTrigger data-testid="select-responsiveness-score">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {"⭐".repeat(score)} ({score})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>{language === "pt" ? "Notas" : "Notes"}</Label>
                  <Textarea
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    placeholder={language === "pt" ? "Observações sobre este contato..." : "Notes about this contact..."}
                    rows={3}
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={contactForm.isPrimary}
                      onCheckedChange={(checked) => setContactForm({ ...contactForm, isPrimary: checked })}
                      data-testid="switch-primary"
                    />
                    <Label>{language === "pt" ? "Contato Principal" : "Primary Contact"}</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={contactForm.isActive}
                      onCheckedChange={(checked) => setContactForm({ ...contactForm, isActive: checked })}
                      data-testid="switch-active"
                    />
                    <Label>{language === "pt" ? "Ativo" : "Active"}</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setContactDialogOpen(false)} data-testid="button-cancel">
                {language === "pt" ? "Cancelar" : "Cancel"}
              </Button>
              <Button 
                onClick={handleSaveContact}
                disabled={!contactForm.name || createContactMutation.isPending || updateContactMutation.isPending}
                data-testid="button-save-contact"
              >
                {(createContactMutation.isPending || updateContactMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {language === "pt" ? "Salvar" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
