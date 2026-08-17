import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">VC Marmitas</h3>
            <p className="text-sm leading-relaxed">
              Marmitas congeladas práticas, saudáveis e feitas com carinho para facilitar o seu dia a dia.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/cardapio" className="hover:text-white">Cardápio</Link></li>
              <li><Link href="/como-funciona" className="hover:text-white">Como funciona</Link></li>
              <li><Link href="/conta" className="hover:text-white">Minha conta</Link></li>
              <li><Link href="/admin" className="hover:text-white">Área admin</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li>WhatsApp: (00) 00000-0000</li>
              <li>Email: contato@vcmarmitas.com.br</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm">
          © {new Date().getFullYear()} VC Marmitas. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}