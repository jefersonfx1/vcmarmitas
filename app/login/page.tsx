"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/conta");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/conta`,
          },
        });
        if (error) throw error;
        setMessage(
          "Conta criada! Verifique seu e-mail para confirmar (se habilitado) ou faça login."
        );
        setMode("login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h1>
      <p className="text-gray-600 text-center mb-8">
        {mode === "login"
          ? "Acesse sua conta para ver pedidos"
          : "Cadastre-se para acompanhar seus pedidos"}
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          {loading
            ? "Aguarde..."
            : mode === "login"
              ? "Entrar"
              : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        {mode === "login" ? (
          <>
            Não tem conta?{" "}
            <button
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
              className="text-primary-600 font-medium hover:underline"
            >
              Cadastre-se
            </button>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className="text-primary-600 font-medium hover:underline"
            >
              Entrar
            </button>
          </>
        )}
      </p>

      <p className="text-center mt-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-primary-600">
          ← Voltar à loja
        </Link>
      </p>
    </div>
  );
}
