"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  applies_to?: "order" | "freight" | "both";
  per_user_limit?: number | null;
  first_purchase_only?: boolean;
};

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: "10",
  min_order_value: "0",
  max_uses: "",
  active: true,
  expires_at: "",
  applies_to: "order" as "order" | "freight" | "both",
  per_user_limit: "",
  first_purchase_only: false,
};

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupons(data.coupons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_value: String(c.min_order_value || 0),
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
      applies_to: c.applies_to || "order",
      per_user_limit:
        c.per_user_limit != null ? String(c.per_user_limit) : "",
      first_purchase_only: Boolean(c.first_purchase_only),
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        code: form.code,
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_value: Number(form.min_order_value) || 0,
        max_uses: form.max_uses === "" ? null : Number(form.max_uses),
        active: form.active,
        expires_at: form.expires_at
          ? new Date(form.expires_at + "T23:59:59").toISOString()
          : null,
        applies_to: form.applies_to,
        per_user_limit:
          form.per_user_limit === "" ? null : Number(form.per_user_limit),
        first_purchase_only: form.first_purchase_only,
      };

      const res = await fetch("/api/admin/coupons", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este cupom?")) return;
    await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    await load();
  }

  function labelDiscount(c: Coupon) {
    const val =
      c.discount_type === "percent"
        ? `${c.discount_value}%`
        : `R$ ${Number(c.discount_value).toFixed(2)}`;
    const target =
      c.applies_to === "freight"
        ? " no frete"
        : c.applies_to === "both"
          ? " no pedido+frete"
          : " no pedido";
    return val + target;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Pedidos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cupons</h1>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Novo cupom
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 space-y-4"
        >
          <h2 className="font-semibold text-lg">
            {editing ? "Editar cupom" : "Novo cupom"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input
                required
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 uppercase"
                placeholder="BEMVINDO10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Aplica em *</label>
              <select
                value={form.applies_to}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    applies_to: e.target.value as "order" | "freight" | "both",
                  }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              >
                <option value="order">Pedido (marmitas)</option>
                <option value="freight">Somente frete</option>
                <option value="both">Pedido + frete</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discount_type: e.target.value as "percent" | "fixed",
                  }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              >
                <option value="percent">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Valor do desconto *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.discount_value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discount_value: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Frete grátis: Aplica em = Frete + Tipo % + Valor 100
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pedido mínimo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.min_order_value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_order_value: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Limite total de usos (vazio = ∞)
              </label>
              <input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Limite por usuário (1 = uso único)
              </label>
              <input
                type="number"
                min="1"
                value={form.per_user_limit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, per_user_limit: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                placeholder="vazio = sem limite"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expira em</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expires_at: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.first_purchase_only}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    first_purchase_only: e.target.checked,
                  }))
                }
              />
              Somente primeira compra
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
              Ativo
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 text-white font-medium px-6 py-2.5 rounded-xl disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-gray-200 px-6 py-2.5 rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-12">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-xl border border-gray-100 p-4 flex items-start justify-between gap-3 ${
                !c.active ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 tracking-wide">{c.code}</h3>
                <p className="text-sm text-gray-500">{c.description || "—"}</p>
                <p className="text-sm mt-1">
                  <span className="font-medium text-primary-600">
                    {labelDiscount(c)}
                  </span>
                  {" · "}
                  min. R$ {Number(c.min_order_value || 0).toFixed(2)}
                  {" · "}
                  usos: {c.used_count}
                  {c.max_uses != null ? `/${c.max_uses}` : "/∞"}
                  {c.per_user_limit != null && ` · ${c.per_user_limit}x/usuário`}
                  {c.first_purchase_only && " · 1ª compra"}
                  {!c.active && " · inativo"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 text-gray-500 hover:text-primary-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Nenhum cupom. Crie o primeiro ou rode o SQL de seed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
