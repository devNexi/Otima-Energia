import { ArrowRight } from "lucide-react";

export function Process() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Statement Section - Like DCVC's "For 13 years..." */}
      <section className="bg-[#F5F5F0] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="dcvc-statement text-gray-900 max-w-5xl">
            For years, we've helped brilliant businesses save up to{" "}
            <span className="text-highlight">35% on electricity</span>{" "}
            through the free energy market.
          </p>
        </div>
      </section>

      {/* Process Steps Section */}
      <section id="process" className="bg-white py-24 lg:py-32 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Section Title */}
          <h2 className="dcvc-section-title text-gray-900 mb-16">How It Works</h2>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-200">01</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Send your bill
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Share your current electricity bill. Our technology analyzes your consumption profile instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-200">02</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                We find the best price
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We scan the entire free market to find the best offers from certified suppliers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-200">03</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                You choose and save
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We present the best options. You choose, and we handle all the migration paperwork.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16">
            <button 
              onClick={() => handleScroll("#contact")}
              className="dcvc-arrow-btn group"
              data-testid="process-cta"
            >
              <span className="arrow">
                <ArrowRight className="w-5 h-5" />
              </span>
              <span className="text-gray-900 group-hover:text-purple-600 transition-colors">
                GET A QUOTE
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
