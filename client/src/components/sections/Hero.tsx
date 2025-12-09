import { ArrowRight } from "lucide-react";

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
          poster="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1920&q=80"
        >
          <source 
            src="https://cdn.coverr.co/videos/coverr-aerial-view-of-solar-panels-1644/1080p.mp4" 
            type="video/mp4" 
          />
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
