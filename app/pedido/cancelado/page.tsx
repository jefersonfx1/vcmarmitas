import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PedidoCanceladoPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Pagamento cancelado
      </h1>
      <p className="text-gray-600 mb-8">
        Você cancelou o pagamento. Seus itens ainda estão no carrinho se quiser
        tentar novamente.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/checkout"
          className="bg-primary-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-primary-700 transition-colors"
        >
          Tentar novamente
        </Link>
        <Link
          href="/carrinho"
          className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-full hover:bg-gray-50 transition-colors"
        >
          Voltar ao carrinho
        </Link>
      </div>
    </div>
  );
}