import { Card, CardContent } from "@/components/ui/card";
import callumImg from "@assets/generated_images/professional_headshot_for_callum.png";
import renanImg from "@assets/generated_images/professional_headshot_for_renan.png";

const team = [
  {
    name: "Callum",
    role: "Co-Founder & Strategy",
    bio: "Ex-tech executive com experiência em mercados desregulados na Europa. Trazendo inovação e transparência para o setor elétrico brasileiro.",
    image: callumImg
  },
  {
    name: "Renan",
    role: "Co-Founder & Operations",
    bio: "Especialista no mercado brasileiro de energia com vasta rede de conexões. Focado em garantir a melhor experiência operacional para nossos clientes.",
    image: renanImg
  }
];

export function About() {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Quem Somos</h2>
          <p className="text-lg text-muted-foreground">
            A Ótima Energia nasceu com a missão de modernizar o mercado de energia no Brasil. 
            Combinamos expertise global com conhecimento local para entregar resultados reais.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {team.map((member, index) => (
            <Card key={index} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all">
              <div className="flex flex-col sm:flex-row h-full">
                <div className="sm:w-2/5 h-64 sm:h-auto relative">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </div>
                <CardContent className="sm:w-3/5 p-8 flex flex-col justify-center">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-foreground">{member.name}</h3>
                    <p className="text-primary font-medium">{member.role}</p>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
