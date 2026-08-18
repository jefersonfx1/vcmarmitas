"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, LogOut, LogIn, Save, Shield } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type Profile = {
  full_name: string | null;
  phone: string | null;
  cpf: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_cep: string | null;
  is_admin: boolean;
};

const emptyProfile: Profile = {
  full_name: "",
  phone: "",
  cpf: "",
  address_street: "",
  address_number: "",
  address_complement: "",
  address_neighborhood: "",
  address_city: "",
  address_cep: "",
  is_admin: false,
};

export default function ContaPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("Supabase não configurado.");
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    async function load() {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData.user;
        setUser(currentUser);

        if (currentUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (profileData) {
            setProfile({
              full_name: profileData.full_name || "",
              phone: profileData.phone || "",
              cpf: profileData.cpf || "",
              address_street: profileData.address_street || "",
              address_number: profileData.address_number || "",
              address_complement: profileData.address_complement || "",
              address_neighborhood: profileData.address_neighborhood || "",
              address_city: profileData.address_city || "",
              address_cep: profileData.address_cep || "",
              is_admin: Boolean(profileData.is_admin),
            });
          }
        }

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
        subscription = data.subscription;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar conta");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => subscription?.unsubscribe();
  }, []);

  function updateField(field: keyof Profile, value: string) {
    setProfile((p) => ({ ...p, [field]: value }));
    setSuccess("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: profile.full_name || null,
        phone: (profile.phone || "").replace(/\D/g, "") || null,
        cpf: (profile.cpf || "").replace(/\D/g, "") || null,
        address_street: profile.address_street || null,
        address_number: profile.address_number || null,
        address_complement: profile.address_complement || null,
        address_neighborhood: profile.address_neighborhood || null,
        address_city: profile.address_city || null,
        address_cep: (profile.address_cep || "").replace(/\D/g, "") || null,
        is_admin:
          profile.is_admin ||
          user.email?.toLowerCase() === "jefersonfferreira23@gmail.com",
        updated_at: new Date().toISOString(),
      });

      if (upsertError) throw upsertError;
      setSuccess("Dados salvos com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">
        Carregando...
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/" className="text-primary-600 hover:underline">
          Voltar à loja
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Minha Conta</h1>
        <p className="text-gray-600 mb-10">
          Faça login para gerenciar seus dados e pedidos.
        </p>

        <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="font-semibold text-lg mb-2">Você não está logado</h2>
          <p className="text-sm text-gray-500 mb-6">
            Entre ou crie uma conta para salvar endereço e acompanhar pedidos.
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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Minha Conta</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          {(profile.is_admin ||
            user.email?.toLowerCase() === "jefersonfferreira23@gmail.com") && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
            >
              <Shield className="w-4 h-4" />
              Painel Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="font-semibold text-lg">Dados pessoais</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                value={profile.full_name || ""}
                onChange={(e) => updateField("full_name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                value={profile.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                value={profile.cpf || ""}
                onChange={(e) => updateField("cpf", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="font-semibold text-lg">Endereço de entrega</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                value={profile.address_cep || ""}
                onChange={(e) => updateField("address_cep", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="00000-000"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
              <input
                value={profile.address_street || ""}
                onChange={(e) => updateField("address_street", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input
                value={profile.address_number || ""}
                onChange={(e) => updateField("address_number", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                value={profile.address_complement || ""}
                onChange={(e) => updateField("address_complement", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Apto, bloco..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input
                value={profile.address_neighborhood || ""}
                onChange={(e) =>
                  updateField("address_neighborhood", e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                value={profile.address_city || ""}
                onChange={(e) => updateField("address_city", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
        )}
        {success && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <p className="text-center mt-10">
        <Link href="/" className="text-primary-600 font-medium hover:underline">
          Continuar comprando →
        </Link>
      </p>
    </div>
  );
}
