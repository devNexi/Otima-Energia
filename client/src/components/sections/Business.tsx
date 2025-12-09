export function Business() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="business" className="bg-white" style={{ padding: "6rem 2rem" }}>
      <div className="max-w-6xl mx-auto">
        {/* Section headline - left aligned like DCVC's "In the Media" */}
        <h2 className="section-headline mb-16">
          Solutions
        </h2>

        {/* Solutions grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* SME Solution - Light purple card */}
          <div className="card-purple">
            <p className="text-sm font-medium text-[#6B46C1] uppercase tracking-wide mb-3">
              Small & Medium Enterprises
            </p>
            <h3 className="text-2xl font-semibold text-[#374151] mb-4">
              Retail Model
            </h3>
            <p className="text-[#374151] leading-relaxed mb-6">
              Guaranteed savings with no upfront investment. Simplified migration process 
              with unified billing and protection against rate fluctuations. Perfect for 
              businesses consuming 500kW+ monthly.
            </p>
            <button 
              onClick={() => handleScroll("#contact")}
              className="link-pink font-semibold inline-flex items-center gap-2"
            >
              Learn More →
            </button>
          </div>

          {/* Industrial Solution - Light purple card */}
          <div className="card-purple">
            <p className="text-sm font-medium text-[#6B46C1] uppercase tracking-wide mb-3">
              Large Industries
            </p>
            <h3 className="text-2xl font-semibold text-[#374151] mb-4">
              Wholesale Access
            </h3>
            <p className="text-[#374151] leading-relaxed mb-6">
              Direct access to the wholesale market with personalized purchasing strategies, 
              real-time market intelligence, regulatory compliance management, and dedicated 
              account support.
            </p>
            <button 
              onClick={() => handleScroll("#contact")}
              className="link-pink font-semibold inline-flex items-center gap-2"
            >
              Learn More →
            </button>
          </div>
        </div>

        {/* Additional benefits section */}
        <div className="mt-16 grid md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-[#6B46C1] mb-2">35%</p>
            <p className="text-[#6B7280] text-sm">Average Savings</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#6B46C1] mb-2">500+</p>
            <p className="text-[#6B7280] text-sm">Companies Served</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#6B46C1] mb-2">R$50M+</p>
            <p className="text-[#6B7280] text-sm">Client Savings</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#6B46C1] mb-2">24/7</p>
            <p className="text-[#6B7280] text-sm">Market Monitoring</p>
          </div>
        </div>
      </div>
    </section>
  );
}
