import Link from "next/link";
import { User, Package, LogIn } from "lucide-react";

export default function ContaPage() {
  // Por enquanto página estática. Auth com Supabase será adicionado depois.
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Minha Conta</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary-600" />
        </div>

        <h2 className="text-xl font-semibold mb-2">Área do cliente</h2>
        <p className="text-gray-600 text-sm mb-6">
          Faça login para ver seus pedidos, endereços e dados pessoais.
        </p>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-medium py-3 rounded-xl hover:bg-primary-700 transition-colors">
            <LogIn className="w-4 h-4" />
            Entrar
          </button>
          <button className="w-full border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Criar conta
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Login e cadastro serão integrados com Supabase em breve.
        </p>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3">
          <Package className="w-5 h-5 text-primary-600" />
          <div>
            <p className="font-medium text-sm">Meus pedidos</p>
            <p className="text-xs text-gray-500">Em breve</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3">
          <User className="w-5 h-5 text-primary-600" />
          <div>
            <p className="font-medium text-sm">Dados pessoais</p>
            <p className="text-xs text-gray-500">Em breve</p>
          </div>
        </div>
      </div>
    </div>
  );
}