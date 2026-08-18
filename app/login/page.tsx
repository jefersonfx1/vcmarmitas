"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    cpf: "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
  });

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured()) {
      setError("Supabase não configurado no Netlify.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        router.push("/conta");
        router.refresh();
        return;
      }

      // Cadastro
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/conta`,
          data: {
            full_name: form.full_name,
          },
        },
      });
      if (signUpError) throw signUpError;

      // Atualiza perfil com dados completos
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: form.full_name,
          phone: form.phone.replace(/\D/g, ""),
          cpf: form.cpf.replace(/\D/g, ""),
          address_cep: form.address_cep.replace(/\D/g, ""),
          address_street: form.address_street,
          address_number: form.address_number,
          address_complement: form.address_complement || null,
          address_neighborhood: form.address_neighborhood || null,
          address_city: form.address_city || null,
          is_admin:
            form.email.toLowerCase() === "jefersonfferreira23@gmail.com",
        });
      }

      setMessage("Conta criada! Você já pode fazer login.");
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h1>
      <p className="text-gray-600 text-center mb-8">
        {mode === "login"
          ? "Acesse sua conta"
          : "Preencha seus dados para agilizar o checkout"}
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
      >
        {mode === "signup" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo *
              </label>
              <input
                required
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp *
                </label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF *
                </label>
                <input
                  required
                  value={form.cpf}
                  onChange={(e) => update("cpf", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Endereço de entrega
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">CEP *</label>
                  <input
                    required
                    value={form.address_cep}
                    onChange={(e) => update("address_cep", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Rua *</label>
                  <input
                    required
                    value={form.address_street}
                    onChange={(e) => update("address_street", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Número *</label>
                  <input
                    required
                    value={form.address_number}
                    onChange={(e) => update("address_number", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Complemento</label>
                  <input
                    value={form.address_complement}
                    onChange={(e) => update("address_complement", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                  <input
                    value={form.address_neighborhood}
                    onChange={(e) =>
                      update("address_neighborhood", e.target.value)
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                  <input
                    value={form.address_city}
                    onChange={(e) => update("address_city", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha *
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
        )}
        {message && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        {mode === "login" ? (
          <>
            Não tem conta?{" "}
            <button
              type="button"
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
              type="button"
default             onClick={() => {
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
