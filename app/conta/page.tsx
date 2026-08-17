import Link from "next/link";
import { User, Package, LogIn } from "lucide-react";

export default function ContaPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Minha Conta</h1>
      <p className="text-gray-600 mb-10">
        Gerencie seus pedidos e dados pessoais.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Login / Cadastro */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="font-semibold text-lg mb-2">Entrar ou Cadastrar</h2>
          <p className="text-sm text-gray-500 mb-4">
            Faça login para acompanhar seus pedidos.
          </p>
          <button
            disabled
            className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-xl opacity-60 cursor-not-allowed"
          >
            Em breve (Supabase Auth)
          </button>
        </div>

        {/* Meus pedidos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="font-semibold text-lg mb-2">Meus Pedidos</h2>
          <p className="text-sm text-gray-500 mb-4">
            Acompanhe o status das suas compras.
          </p>
          <button
            disabled
            className="w-full border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl cursor-not-allowed"
          >
            Disponível após login
          </button>
        </div>

        {/* Dados pessoais */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="font-semibold text-lg mb-2">Dados Pessoais</h2>
          <p className="text-sm text-gray-500 mb-4">
            Nome, endereço e telefone de entrega.
          </p>
          <button
            disabled
            className="w-full border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl cursor-not-allowed"
          >
            Disponível após login
          </button>
        </div>
      </div>

      <div className="mt-10 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 text-center">
        A autenticação com Supabase será configurada em breve.
        <br />
        <Link href="/admin" className="text-primary-600 hover:underline mt-1 inline-block">
          Acessar Painel Admin (temporário)
        </Link>
      </div>
    </div>
  );
}