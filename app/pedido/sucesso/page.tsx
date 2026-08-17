import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PedidoSucessoPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Pedido realizado com sucesso!
      </h1>
      <p className="text-gray-600 mb-8">
        Recebemos seu pagamento. Em breve você receberá a confirmação e o
        acompanhamento do pedido.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/cardapio"
          className="bg-primary-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-primary-700 transition-colors"
        >
          Continuar comprando
        </Link>
        <Link
          href="/conta"
          className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-full hover:bg-gray-50 transition-colors"
        >
          Minha conta
        </Link>
      </div>
    </div>
  );
}