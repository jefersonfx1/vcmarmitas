export default function SobrePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Sobre a VC Marmitas</h1>

      <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
        <p>
          A <strong>VC Marmitas</strong> nasceu com o objetivo de facilitar a
          alimentação do dia a dia. Oferecemos marmitas congeladas práticas,
          saborosas e preparadas com ingredientes selecionados.
        </p>

        <p>
          Nosso cardápio inclui opções tradicionais, fitness e vegetarianas,
          pensadas para quem busca praticidade sem abrir mão do sabor e da
          qualidade.
        </p>

        <p>
          Basta escolher suas marmitas preferidas, finalizar o pedido e receber
          em casa. É só aquecer e aproveitar!
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
          Por que escolher a gente?
        </h2>

        <ul className="list-disc list-inside space-y-2">
          <li>Congelamento rápido que preserva sabor e nutrientes</li>
          <li>Porções equilibradas e bem apresentadas</li>
          <li>Entrega prática na sua região</li>
          <li>Cardápio variado e em constante renovação</li>
        </ul>
      </div>
    </div>
  );
}