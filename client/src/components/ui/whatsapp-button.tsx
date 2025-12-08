import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5511999999999"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 hover:-translate-y-1 transition-transform duration-300"
    >
      <Button
        size="icon"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-xl text-white border-4 border-white"
      >
        <MessageCircle className="w-8 h-8" />
      </Button>
    </a>
  );
}
