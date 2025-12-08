import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Business } from "@/components/sections/Business";
import { Tech } from "@/components/sections/Tech";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans transition-colors duration-500">
      <Navbar />
      <main>
        <Hero />
        <Process />
        <Business />
        <Tech />
        <About />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      <ThemeSwitcher />
    </div>
  );
}
