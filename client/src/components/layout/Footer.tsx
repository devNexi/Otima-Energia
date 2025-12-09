export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScroll = (href: string) => {
    if (href === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-[#F5F5F0] py-24 lg:py-32 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Large Navigation Links - DCVC Style */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {/* Main Nav */}
          <div className="space-y-4">
            <button 
              onClick={() => handleScroll("#process")}
              className="dcvc-footer-link block text-left"
            >
              How It Works
            </button>
            <button 
              onClick={() => handleScroll("#business")}
              className="dcvc-footer-link block text-left"
            >
              Solutions
            </button>
            <button 
              onClick={() => handleScroll("#contact")}
              className="dcvc-footer-link block text-left"
            >
              Contact
            </button>
          </div>

          {/* Topics */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-6">Services</p>
            <ul className="space-y-3 text-gray-600">
              <li>SME Energy</li>
              <li>Industrial Energy</li>
              <li>Energy Consulting</li>
              <li>Market Analysis</li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <p className="text-sm tracking-wide text-gray-500 uppercase mb-6">Location</p>
            <div className="text-gray-600 space-y-1">
              <p>Rio de Janeiro</p>
              <p>Brazil</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-8 border-t border-gray-300">
          {/* Logo */}
          <button 
            onClick={() => handleScroll("#top")}
            className="text-xl font-semibold tracking-tight text-gray-900"
          >
            ÓTIMA<br/>ENERGIA
          </button>

          {/* Copyright & Links */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 text-sm text-gray-500">
            <span>©{currentYear} Ótima Energia. All rights reserved.</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-purple-600 cursor-pointer transition-colors">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
