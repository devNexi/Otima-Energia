import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Contact } from "@/components/sections/Contact";

export default function Contato() {
  return (
    <div className="min-h-screen" style={{ background: "#09081e" }}>
      <Navbar />
      <main className="pt-20">
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
