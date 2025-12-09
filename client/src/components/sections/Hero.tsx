export function Hero() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="top" className="bg-white pt-32" style={{ padding: "8rem 2rem 6rem 2rem" }}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Massive purple headline like DCVC's green */}
        <h1 className="hero-headline mb-6">
          Intelligent Energy for Brazilian Businesses
        </h1>
        
        {/* Gray subheadline */}
        <p className="hero-subheadline max-w-2xl mx-auto mb-10">
          We help companies save up to 35% on electricity through the free energy market. 
          Smart technology, transparent pricing, zero complexity.
        </p>
        
        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => handleScroll("#contact")}
            className="btn-primary-dcvc"
            data-testid="hero-cta-primary"
          >
            Get Your Free Quote
          </button>
          <button 
            onClick={() => handleScroll("#process")}
            className="px-8 py-4 font-semibold text-[#6B46C1] border-2 border-[#6B46C1] rounded-md hover:bg-[#F5F3FF] transition-colors"
            data-testid="hero-cta-secondary"
          >
            Learn How It Works
          </button>
        </div>
      </div>
    </section>
  );
}
