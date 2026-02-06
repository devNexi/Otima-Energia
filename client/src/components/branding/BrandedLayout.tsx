import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";

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
}

interface BrandedLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  brandKit?: BrandKit | null;
}

export function useBrandKit() {
  return useQuery({
    queryKey: ["/api/brand-kit"],
    queryFn: async () => {
      const res = await fetch("/api/brand-kit");
      const json = await res.json();
      return json.brandKit as BrandKit | null;
    }
  });
}

export function BrandedLayout({ 
  children, 
  showHeader = true, 
  showFooter = true,
  className = "",
  brandKit: propBrandKit
}: BrandedLayoutProps) {
  const { data: fetchedBrandKit } = useBrandKit();
  const brandKit = propBrandKit || fetchedBrandKit;

  const defaultKit: BrandKit = {
    id: 0,
    brandName: "Ótima Energia",
    tagline: null,
    primaryColor: "#9e3ffd",
    secondaryColor: "#df0af2",
    darkColor: "#16163f",
    lightBgColor: "#eee7f1",
    textColor: "#736d77",
    fontFamily: "Inter",
    headingFontFamily: null,
    logoUrl: null,
    logoLightUrl: null,
    faviconUrl: null,
    footerText: null,
    footerPhone: null,
    footerAddress: null,
    websiteUrl: "https://otimaenergia.com"
  };

  const kit = brandKit || defaultKit;

  return (
    <div 
      className={`min-h-screen ${className}`}
      style={{ 
        fontFamily: `${kit.fontFamily}, sans-serif`,
        backgroundColor: kit.lightBgColor,
        "--brand-primary": kit.primaryColor,
        "--brand-secondary": kit.secondaryColor,
        "--brand-dark": kit.darkColor,
        "--brand-light": kit.lightBgColor,
        "--brand-text": kit.textColor,
      } as React.CSSProperties}
    >
      {showHeader && (
        <BrandedHeader brandKit={kit} />
      )}
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {showFooter && (
        <BrandedFooter brandKit={kit} />
      )}
    </div>
  );
}

interface BrandedHeaderProps {
  brandKit: BrandKit;
}

export function BrandedHeader({ brandKit }: BrandedHeaderProps) {
  return (
    <header 
      className="py-6 px-4"
      style={{ backgroundColor: brandKit.darkColor }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {brandKit.logoUrl ? (
            <img 
              src={brandKit.logoUrl} 
              alt={brandKit.brandName} 
              className="h-10"
            />
          ) : (
            <span 
              className="text-2xl font-bold"
              style={{ color: brandKit.primaryColor }}
            >
              {brandKit.brandName}
            </span>
          )}
        </div>
        {brandKit.tagline && (
          <span className="text-sm text-white/70 hidden sm:block">
            {brandKit.tagline}
          </span>
        )}
      </div>
    </header>
  );
}

interface BrandedFooterProps {
  brandKit: BrandKit;
}

export function BrandedFooter({ brandKit }: BrandedFooterProps) {
  return (
    <footer 
      className="py-6 px-4 mt-auto"
      style={{ backgroundColor: brandKit.darkColor }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-white/60 text-sm">
          {brandKit.footerText || `© ${new Date().getFullYear()} ${brandKit.brandName}. Todos os direitos reservados.`}
        </p>
        {brandKit.footerPhone && (
          <p className="text-white/50 text-xs mt-1">{brandKit.footerPhone}</p>
        )}
        {brandKit.footerAddress && (
          <p className="text-white/50 text-xs">{brandKit.footerAddress}</p>
        )}
        {brandKit.websiteUrl && (
          <a 
            href={brandKit.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm mt-2 inline-block"
            style={{ color: brandKit.primaryColor }}
          >
            {brandKit.websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
    </footer>
  );
}

interface BrandedCardProps {
  children: ReactNode;
  variant?: "default" | "highlighted" | "gradient";
  className?: string;
}

export function BrandedCard({ children, variant = "default", className = "" }: BrandedCardProps) {
  const { data: brandKit } = useBrandKit();

  const baseStyles = "rounded-xl p-6";
  
  if (variant === "gradient") {
    return (
      <div 
        className={`${baseStyles} shadow-lg ${className}`}
        style={{ 
          background: `linear-gradient(135deg, ${brandKit?.primaryColor || "#9e3ffd"}, ${brandKit?.secondaryColor || "#df0af2"})` 
        }}
      >
        {children}
      </div>
    );
  }

  if (variant === "highlighted") {
    return (
      <div 
        className={`${baseStyles} border-2 shadow-md ${className}`}
        style={{ 
          borderColor: brandKit?.primaryColor || "#9e3ffd",
          backgroundColor: "white"
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`${baseStyles} bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

interface BrandedButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  onClick?: () => void;
}

export function BrandedButton({ 
  children, 
  variant = "primary", 
  className = "",
  onClick
}: BrandedButtonProps) {
  const { data: brandKit } = useBrandKit();

  const baseStyles = "px-4 py-2 rounded-md font-medium text-sm transition-colors";
  
  if (variant === "secondary") {
    return (
      <button 
        onClick={onClick}
        className={`${baseStyles} text-white ${className}`}
        style={{ backgroundColor: brandKit?.secondaryColor || "#df0af2" }}
      >
        {children}
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button 
        onClick={onClick}
        className={`${baseStyles} border-2 ${className}`}
        style={{ 
          borderColor: brandKit?.primaryColor || "#9e3ffd",
          color: brandKit?.primaryColor || "#9e3ffd"
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} text-white ${className}`}
      style={{ backgroundColor: brandKit?.primaryColor || "#9e3ffd" }}
    >
      {children}
    </button>
  );
}

export function BrandedHeading({ 
  children, 
  level = 1,
  className = ""
}: { 
  children: ReactNode; 
  level?: 1 | 2 | 3;
  className?: string;
}) {
  const { data: brandKit } = useBrandKit();
  
  const sizeClasses = {
    1: "text-3xl font-bold",
    2: "text-2xl font-semibold",
    3: "text-xl font-medium"
  };

  const style = { color: brandKit?.darkColor || "#16163f" };
  const headingClass = `${sizeClasses[level]} ${className}`;
  
  if (level === 1) return <h1 className={headingClass} style={style}>{children}</h1>;
  if (level === 2) return <h2 className={headingClass} style={style}>{children}</h2>;
  return <h3 className={headingClass} style={style}>{children}</h3>;
}

export function BrandedText({ 
  children, 
  className = ""
}: { 
  children: ReactNode;
  className?: string;
}) {
  const { data: brandKit } = useBrandKit();
  
  return (
    <p 
      className={className}
      style={{ color: brandKit?.textColor || "#736d77" }}
    >
      {children}
    </p>
  );
}

export { type BrandKit };
