"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [freightMsg, setFreightMsg] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
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

  async function handleCepBlur() {
    const digits = form.address_cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    setFreightMsg("");
    try {
      const res = await fetch(`/api/cep?cep=${digits}`);
      const data = await res.json();
      if (!res.ok) {
        setFreightMsg(data.error || "CEP não encontrado");
        return;
      }

      setForm((p) => ({
        ...p,
        address_cep: digits,
        address_street: data.address.street || p.address_street,
        address_neighborhood: data.address.neighborhood || p.address_neighborhood,
        address_city: data.address.city || p.address_city,
      }));

      if (data.freight?.available) {
        setFreightMsg(
          `Entrega disponível: ${data.freight.label} — R$ ${Number(data.freight.price).toFixed(2)}`
        );
      } else {
        setFreightMsg(
          data.freight?.message ||
            "Ainda não entregamos neste CEP (só Brasília e entorno)."
        );
      }
    } catch {
      setFreightMsg("Não foi possível consultar o CEP");
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured()) {
      setError("Supabase não configurado no Netlify.");
      return;
    }

    if (mode === "signup" && form.password !== form.passwordConfirm) {
      setError("As senhas não coincidem.");
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

      const phone = form.phone.replace(/\D/g, "");
      const cpf = form.cpf.replace(/\D/g, "");
      const cep = form.address_cep.replace(/\D/g, "");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/conta`,
          data: {
            full_name: form.full_name,
            phone,
            cpf,
            address_street: form.address_street,
            address_number: form.address_number,
            address_complement: form.address_complement || "",
            address_neighborhood: form.address_neighborhood || "",
            address_city: form.address_city || "",
            address_cep: cep,
          },
        },
      });
      if (signUpError) throw signUpError;

      if (data.user) {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            email: form.email,
            full_name: form.full_name,
            phone,
            cpf,
            address_street: form.address_street,
            address_number: form.address_number,
            address_complement: form.address_complement || null,
            address_neighborhood: form.address_neighborhood || null,
            address_city: form.address_city || null,
            address_cep: cep,
          }),
        });
      }

      if (data.session) {
        router.push("/conta");
        router.refresh();
        return;
      }

      setMessage(
        "Conta criada! Faça login para continuar. Seus dados já ficam salvos para o checkout."
      );
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
          : "Preencha seus dados uma vez — no checkout eles já vêm prontos"}
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
                Endereço de entrega (Brasília e entorno)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    CEP * {cepLoading && "(buscando...)"}
                  </label>
                  <input
                    required
                    value={form.address_cep}
                    onChange={(e) => update("address_cep", e.target.value)}
                    onBlur={handleCepBlur}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="00000-000"
                  />
                  {freightMsg && (
                    <p className="text-xs mt-1 text-gray-600">{freightMsg}</p>
                  )}
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

        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.passwordConfirm}
              onChange={(e) => update("passwordConfirm", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Repita a senha"
            />
          </div>
        )}

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
