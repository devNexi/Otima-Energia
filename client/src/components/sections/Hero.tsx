import { ArrowRight } from "lucide-react";
import heroVideo from "@assets/generated_videos/solar_farm_aerial_sunset.mp4";

export function Hero() {
  const handleScroll = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="top" className="relative min-h-screen pt-20">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content - Bottom left like DCVC */}
      <div className="relative z-10 min-h-screen flex items-end">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-24 w-full">
          <h1 className="dcvc-statement text-white max-w-4xl">
            We are{" "}
            <span className="text-highlight">intelligent energy</span>
            {" "}for Brazilian businesses.
          </h1>
        </div>
      </div>
    </section>
  );
}
