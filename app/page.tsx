import Link from "next/link";
import { ArrowRight, Truck, Shield, Clock, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Marmitas congeladas práticas e deliciosas
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              Comida caseira de verdade, pronta em minutos. Escolha seu cardápio e receba em casa.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/cardapio"
                className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-full hover:bg-primary-50 transition"
              >
                Ver cardápio
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/como-funciona"
                className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition"
              >
                Como funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: Truck, title: "Entrega rápida", desc: "Receba no conforto da sua casa" },
            { icon: Shield, title: "Qualidade garantida", desc: "Ingredientes selecionados" },
            { icon: Clock, title: "Prático", desc: "Pronto em poucos minutos" },
            { icon: Heart, title: "Feito com carinho", desc: "Receitas caseiras de verdade" },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-600 mb-4">
                <item.icon size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Pronto para experimentar?</h2>
          <p className="text-gray-600 mb-8">
            Monte seu pedido agora e tenha refeições saudáveis a semana toda.
          </p>
          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-primary-700 transition"
          >
            Montar meu pedido
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}