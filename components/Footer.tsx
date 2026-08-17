import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">VC Marmitas</h3>
            <p className="text-sm text-gray-400">
              Marmitas congeladas práticas, saudáveis e deliciosas para o seu dia a dia.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cardapio" className="hover:text-white transition-colors">
                  Cardápio
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-white transition-colors">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link href="/conta" className="hover:text-white transition-colors">
                  Minha conta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Contato</h4>
            <p className="text-sm text-gray-400">
              Dúvidas ou pedidos especiais?<br />
              Entre em contato pelo WhatsApp.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} VC Marmitas. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}