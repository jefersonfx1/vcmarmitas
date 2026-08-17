import Link from "next/link";
import { Clock } from "lucide-react";

export default function PedidoExpiradoPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-yellow-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Link de pagamento expirado
      </h1>
      <p className="text-gray-600 mb-8">
        O tempo para concluir o pagamento acabou. Você pode gerar um novo link
        a partir do checkout.
      </p>
      <Link
        href="/checkout"
        className="inline-block bg-primary-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-primary-700 transition-colors"
      >
        Gerar novo pagamento
      </Link>
    </div>
  );
}