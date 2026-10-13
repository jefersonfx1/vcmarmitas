import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const WHATSAPP = "5561982551871";
const WHATSAPP_MSG = encodeURIComponent(
  "Olá! Venho do site e tenho dúvidas sobre os produtos."
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP}?text=${WHATSAPP_MSG}`;

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <BrandLogo size="md" muted className="ring-1 ring-white/10" />
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight leading-tight">
                  VC Marmitas
                </h3>
                <p className="text-[11px] text-gray-500 tracking-wide">
                  Vani Aguiar · Personal Chef
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-4">
              Marmitas congeladas práticas, saudáveis e deliciosas — feitas com o
              carinho da personal chef Vani Aguiar.
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              Brasília · Valparaíso · Novo Gama
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#kits" className="hover:text-primary-400 transition-colors">
                  Kits e cardápio
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-primary-400 transition-colors">
                  Sobre a chef
                </Link>
              </li>
              <li>
                <Link href="/conta" className="hover:text-primary-400 transition-colors">
                  Minha conta
                </Link>
              </li>
              <li>
                <Link href="/carrinho" className="hover:text-primary-400 transition-colors">
                  Carrinho
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Contato
            </h4>
            <p className="text-sm text-gray-400 mb-3 leading-relaxed">
              Dúvidas ou suporte? Fale com a gente no WhatsApp.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
            </a>
            <p className="text-[11px] text-gray-500 mt-2">(61) 98255-1871</p>
          </div>
        </div>

        <div className="border-t border-gray-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} VC Marmitas. Todos os direitos reservados.</p>
          <p className="text-xs">Feito com carinho para a sua rotina</p>
        </div>
      </div>
    </footer>
  );
}
