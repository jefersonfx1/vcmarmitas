"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, LogOut, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function ContaPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Minha Conta</h1>
        <p className="text-gray-600 mb-10">
          Faça login para acompanhar seus pedidos.
        </p>

        <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="font-semibold text-lg mb-2">Você não está logado</h2>
          <p className="text-sm text-gray-500 mb-6">
            Entre ou crie uma conta para ver seu histórico de pedidos.
          </p>
          <Link
            href="/login"
            className="block w-full bg-primary-600 text-white font-medium py-2.5 rounded-xl hover:bg-primary-700 transition-colors"
          >
            Entrar / Cadastrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Minha Conta</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="font-semibold text-lg mb-1">Dados da conta</h2>
          <p className="text-sm text-gray-500 mb-1">E-mail: {user.email}</p>
          <p className="text-xs text-gray-400">
            ID: {user.id.slice(0, 8)}...
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="font-semibold text-lg mb-1">Meus pedidos</h2>
          <p className="text-sm text-gray-500 mb-4">
            Histórico de compras em breve vinculado ao seu e-mail.
          </p>
          <p className="text-xs text-gray-400">
            Por enquanto, os pedidos aparecem no painel admin.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/cardapio"
          className="text-primary-600 font-medium hover:underline"
        >
          Continuar comprando →
        </Link>
      </div>
    </div>
  );
}
