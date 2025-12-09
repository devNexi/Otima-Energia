export function Process() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const steps = [
    {
      number: "1",
      title: "Send Your Bill",
      description: "Share your current electricity bill. Our technology analyzes your consumption profile instantly and identifies savings opportunities."
    },
    {
      number: "2", 
      title: "We Find the Best Price",
      description: "We scan the entire free market to find the best offers from certified suppliers, comparing rates and contract terms."
    },
    {
      number: "3",
      title: "You Choose and Save",
      description: "We present the best options transparently. You choose, and we handle all the migration paperwork and regulatory compliance."
    }
  ];

  return (
    <section id="process" className="bg-purple-section" style={{ padding: "6rem 2rem" }}>
      <div className="max-w-6xl mx-auto">
        {/* Section headline - purple like DCVC */}
        <h2 className="section-headline text-center mb-16">
          How It Works
        </h2>

        {/* Cards grid with proper spacing */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="card-dcvc bg-white">
              {/* Purple number circle */}
              <div className="number-circle mb-6">
                {step.number}
              </div>
              
              {/* Card title - can be purple for hierarchy */}
              <h3 className="text-xl font-semibold text-[#6B46C1] mb-3">
                {step.title}
              </h3>
              
              {/* Description */}
              <p className="text-[#374151] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button 
            onClick={() => handleScroll("#contact")}
            className="btn-primary-dcvc"
            data-testid="process-cta"
          >
            Start Saving Now
          </button>
        </div>
      </div>
    </section>
  );
}
