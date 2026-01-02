import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Type, Image, Save, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BrandKit {
  id: number;
  brandName: string;
  tagline: string | null;
  primaryColor: string;
  secondaryColor: string;
  darkColor: string;
  lightBgColor: string;
  textColor: string;
  fontFamily: string;
  headingFontFamily: string | null;
  logoUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
  footerText: string | null;
  footerPhone: string | null;
  footerAddress: string | null;
  websiteUrl: string | null;
  websiteStyleRef: string | null;
  updatedAt: string | null;
  updatedByUserId: number | null;
}

export function BrandKitPanel() {
  const queryClient = useQueryClient();
  const [previewVisible, setPreviewVisible] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/brand-kit"],
    queryFn: async () => {
      const res = await fetch("/api/brand-kit");
      const json = await res.json();
      return json.brandKit as BrandKit | null;
    }
  });

  const [form, setForm] = useState<Partial<BrandKit>>({});
  const currentKit = { ...data, ...form };

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<BrandKit>) => {
      if (!data?.id) throw new Error("No brand kit found");
      const res = await fetch(`/api/brand-kit/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update brand kit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-kit"] });
      setForm({});
      toast.success("Brand kit updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update brand kit");
    }
  });

  const handleChange = (field: keyof BrandKit, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (Object.keys(form).length === 0) {
      toast.info("No changes to save");
      return;
    }
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brand Kit Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Customize colors, fonts, and branding for proposals and documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPreviewVisible(!previewVisible)}
            data-testid="toggle-preview"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewVisible ? "Hide" : "Show"} Preview
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending || Object.keys(form).length === 0}
            data-testid="save-brand-kit"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </CardTitle>
              <CardDescription>Brand color palette</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="primaryColor"
                      value={currentKit.primaryColor || "#9e3ffd"}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="w-12 h-9 p-1 cursor-pointer"
                      data-testid="input-primary-color"
                    />
                    <Input
                      value={currentKit.primaryColor || "#9e3ffd"}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      placeholder="#9e3ffd"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="secondaryColor"
                      value={currentKit.secondaryColor || "#df0af2"}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      className="w-12 h-9 p-1 cursor-pointer"
                      data-testid="input-secondary-color"
                    />
                    <Input
                      value={currentKit.secondaryColor || "#df0af2"}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      placeholder="#df0af2"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="darkColor">Dark Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="darkColor"
                      value={currentKit.darkColor || "#16163f"}
                      onChange={(e) => handleChange("darkColor", e.target.value)}
                      className="w-12 h-9 p-1 cursor-pointer"
                      data-testid="input-dark-color"
                    />
                    <Input
                      value={currentKit.darkColor || "#16163f"}
                      onChange={(e) => handleChange("darkColor", e.target.value)}
                      placeholder="#16163f"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lightBgColor">Light Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="lightBgColor"
                      value={currentKit.lightBgColor || "#eee7f1"}
                      onChange={(e) => handleChange("lightBgColor", e.target.value)}
                      className="w-12 h-9 p-1 cursor-pointer"
                      data-testid="input-light-bg-color"
                    />
                    <Input
                      value={currentKit.lightBgColor || "#eee7f1"}
                      onChange={(e) => handleChange("lightBgColor", e.target.value)}
                      placeholder="#eee7f1"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="textColor"
                      value={currentKit.textColor || "#736d77"}
                      onChange={(e) => handleChange("textColor", e.target.value)}
                      className="w-12 h-9 p-1 cursor-pointer"
                      data-testid="input-text-color"
                    />
                    <Input
                      value={currentKit.textColor || "#736d77"}
                      onChange={(e) => handleChange("textColor", e.target.value)}
                      placeholder="#736d77"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4" />
                Typography
              </CardTitle>
              <CardDescription>Font settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={currentKit.fontFamily || "Inter"}
                  onChange={(e) => handleChange("fontFamily", e.target.value)}
                  placeholder="Inter"
                  data-testid="input-font-family"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4" />
                Logo & Branding
              </CardTitle>
              <CardDescription>Company logos and assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={currentKit.brandName || "Ótima Energia"}
                  onChange={(e) => handleChange("brandName", e.target.value)}
                  placeholder="Ótima Energia"
                  data-testid="input-brand-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={currentKit.tagline || ""}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  placeholder="Your energy, our expertise"
                  data-testid="input-tagline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL (Dark background)</Label>
                <Input
                  id="logoUrl"
                  value={currentKit.logoUrl || ""}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder="https://..."
                  data-testid="input-logo-url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoLightUrl">Logo URL (Light background)</Label>
                <Input
                  id="logoLightUrl"
                  value={currentKit.logoLightUrl || ""}
                  onChange={(e) => handleChange("logoLightUrl", e.target.value)}
                  placeholder="https://..."
                  data-testid="input-logo-light-url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={currentKit.faviconUrl || ""}
                  onChange={(e) => handleChange("faviconUrl", e.target.value)}
                  placeholder="https://..."
                  data-testid="input-favicon-url"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Footer & Contact</CardTitle>
              <CardDescription>Footer content for proposals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={currentKit.footerText || ""}
                  onChange={(e) => handleChange("footerText", e.target.value)}
                  placeholder="Ótima Energia • contato@otimaenergia.com.br"
                  rows={2}
                  data-testid="input-footer-text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footerPhone">Phone</Label>
                <Input
                  id="footerPhone"
                  value={currentKit.footerPhone || ""}
                  onChange={(e) => handleChange("footerPhone", e.target.value)}
                  placeholder="+55 11 99999-9999"
                  data-testid="input-footer-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footerAddress">Address</Label>
                <Input
                  id="footerAddress"
                  value={currentKit.footerAddress || ""}
                  onChange={(e) => handleChange("footerAddress", e.target.value)}
                  placeholder="Rio de Janeiro - Brasil"
                  data-testid="input-footer-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website</Label>
                <Input
                  id="websiteUrl"
                  value={currentKit.websiteUrl || ""}
                  onChange={(e) => handleChange("websiteUrl", e.target.value)}
                  placeholder="https://otimaenergia.com.br"
                  data-testid="input-website-url"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {previewVisible && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Live Preview</CardTitle>
                <CardDescription>See how your brand appears</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="rounded-lg overflow-hidden border"
                  style={{ fontFamily: currentKit.fontFamily || "Inter, sans-serif" }}
                >
                  <div 
                    className="p-6"
                    style={{ backgroundColor: currentKit.darkColor || "#16163f" }}
                  >
                    <div className="flex items-center gap-3">
                      {currentKit.logoUrl ? (
                        <img 
                          src={currentKit.logoUrl} 
                          alt="Logo" 
                          className="h-8"
                        />
                      ) : (
                        <div 
                          className="text-xl font-bold"
                          style={{ color: currentKit.primaryColor || "#9e3ffd" }}
                        >
                          {currentKit.brandName || "Ótima Energia"}
                        </div>
                      )}
                    </div>
                    {currentKit.tagline && (
                      <p className="mt-2 text-sm opacity-80" style={{ color: "#fff" }}>
                        {currentKit.tagline}
                      </p>
                    )}
                  </div>
                  
                  <div 
                    className="p-6"
                    style={{ backgroundColor: currentKit.lightBgColor || "#eee7f1" }}
                  >
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: currentKit.darkColor || "#16163f" }}
                    >
                      Proposta Comercial
                    </h3>
                    <p style={{ color: currentKit.textColor || "#736d77" }}>
                      Esta é uma prévia de como seus documentos aparecerão para clientes.
                    </p>
                    
                    <div className="mt-4 flex gap-2">
                      <button 
                        className="px-4 py-2 rounded-md text-white text-sm font-medium"
                        style={{ backgroundColor: currentKit.primaryColor || "#9e3ffd" }}
                      >
                        Botão Primário
                      </button>
                      <button 
                        className="px-4 py-2 rounded-md text-white text-sm font-medium"
                        style={{ backgroundColor: currentKit.secondaryColor || "#df0af2" }}
                      >
                        Botão Secundário
                      </button>
                    </div>
                  </div>

                  <div 
                    className="p-4 border-t text-center text-xs"
                    style={{ 
                      color: currentKit.textColor || "#736d77",
                      backgroundColor: "#fff"
                    }}
                  >
                    {currentKit.footerText || `© ${new Date().getFullYear()} ${currentKit.brandName || "Ótima Energia"}. Todos os direitos reservados.`}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-medium">Color Swatches</h4>
                  <div className="flex gap-2">
                    {[
                      { name: "Primary", color: currentKit.primaryColor || "#9e3ffd" },
                      { name: "Secondary", color: currentKit.secondaryColor || "#df0af2" },
                      { name: "Dark", color: currentKit.darkColor || "#16163f" },
                      { name: "Light", color: currentKit.lightBgColor || "#eee7f1" },
                      { name: "Text", color: currentKit.textColor || "#736d77" }
                    ].map(({ name, color }) => (
                      <div key={name} className="text-center">
                        <div 
                          className="w-10 h-10 rounded-md border shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted-foreground mt-1 block">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">CSS Variables</CardTitle>
                <CardDescription>Copy these for custom styling</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`:root {
  --brand-primary: ${currentKit.primaryColor || "#9e3ffd"};
  --brand-secondary: ${currentKit.secondaryColor || "#df0af2"};
  --brand-dark: ${currentKit.darkColor || "#16163f"};
  --brand-light: ${currentKit.lightBgColor || "#eee7f1"};
  --brand-text: ${currentKit.textColor || "#736d77"};
  --brand-font: "${currentKit.fontFamily || "Inter"}", sans-serif;
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
