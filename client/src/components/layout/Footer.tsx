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
    <footer className="footer-dark" style={{ padding: "4rem 2rem" }}>
      <div className="max-w-6xl mx-auto">
        {/* Main footer content */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo and tagline */}
          <div className="md:col-span-1">
            <button 
              onClick={() => handleScroll("#top")}
              className="text-xl font-bold text-white mb-4 block"
            >
              Ótima Energia
            </button>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              Intelligent energy solutions for Brazilian businesses.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-white font-semibold mb-4">Navigation</p>
            <ul className="space-y-3">
              <li>
                <button onClick={() => handleScroll("#top")} className="footer-link">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleScroll("#process")} className="footer-link">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => handleScroll("#business")} className="footer-link">
                  Solutions
                </button>
              </li>
              <li>
                <button onClick={() => handleScroll("#contact")} className="footer-link">
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="text-white font-semibold mb-4">Services</p>
            <ul className="space-y-3 text-[#9CA3AF]">
              <li>SME Energy</li>
              <li>Industrial Energy</li>
              <li>Energy Consulting</li>
              <li>Market Analysis</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold mb-4">Contact</p>
            <ul className="space-y-3 text-[#9CA3AF]">
              <li>contato@otimaenergia.com.br</li>
              <li>+55 21 99999-9999</li>
              <li>Rio de Janeiro, Brazil</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#374151] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#9CA3AF] text-sm">
            © {currentYear} Ótima Energia. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <span className="footer-link cursor-pointer">Privacy Policy</span>
            <span className="footer-link cursor-pointer">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
