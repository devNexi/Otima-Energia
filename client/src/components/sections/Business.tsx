import { ArrowRight } from "lucide-react";

export function Business() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Statement Section */}
      <section className="bg-[#F5F5F0] py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl">
            We help businesses{" "}
            <span className="text-highlight-pink">unlock savings</span>{" "}
            across all energy consumption levels.
          </p>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="business" className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Section Title */}
          <h2 className="dcvc-section-title text-gray-900 mb-16">Solutions</h2>

          {/* Solutions Grid - Like DCVC Spotlight cards */}
          <div className="grid md:grid-cols-2 gap-px bg-gray-200">
            {/* SME Solution */}
            <div className="bg-white p-8 lg:p-12">
              <p className="text-sm tracking-wide text-gray-500 uppercase mb-4">
                Small & Medium Enterprises
              </p>
              <h3 className="text-2xl font-medium text-gray-900 mb-4">
                Retail Model
              </h3>
              <p className="text-gray-600 leading-relaxed mb-8">
                Guaranteed savings with no upfront investment. Simplified migration process with unified billing and protection against rate fluctuations.
              </p>
              <button 
                onClick={() => handleScroll("#contact")}
                className="dcvc-arrow-btn group"
              >
                <span className="arrow">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-gray-900 group-hover:text-purple-600 transition-colors">
                  LEARN MORE
                </span>
              </button>
            </div>

            {/* Industrial Solution */}
            <div className="bg-white p-8 lg:p-12">
              <p className="text-sm tracking-wide text-gray-500 uppercase mb-4">
                Large Industries
              </p>
              <h3 className="text-2xl font-medium text-gray-900 mb-4">
                Wholesale Access
              </h3>
              <p className="text-gray-600 leading-relaxed mb-8">
                Direct access to the wholesale market with personalized purchasing strategies, market intelligence reports, and regulatory compliance management.
              </p>
              <button 
                onClick={() => handleScroll("#contact")}
                className="dcvc-arrow-btn group"
              >
                <span className="arrow">
                  <ArrowRight className="w-5 h-5" />
                </span>
                <span className="text-gray-900 group-hover:text-purple-600 transition-colors">
                  LEARN MORE
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
