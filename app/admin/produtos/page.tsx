"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  calories: number | null;
  weight: string | null;
  active: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  price: "24.90",
  category: "tradicional",
  image_url: "",
  calories: "",
  weight: "400g",
  active: true,
};

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data.products || []);
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

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      category: p.category,
      image_url: p.image_url || "",
      calories: p.calories ? String(p.calories) : "",
      weight: p.weight || "",
      active: p.active,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        category: form.category,
        image_url: form.image_url || null,
        calories: form.calories ? Number(form.calories) : null,
        weight: form.weight || null,
        active: form.active,
      };

      const res = await fetch("/api/admin/products", {
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

  async function handleDeactivate(id: string) {
    if (!confirm("Desativar este sabor?")) return;
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    await load();
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
          <h1 className="text-3xl font-bold text-gray-900">Sabores / Produtos</h1>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Novo sabor
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
            {editing ? "Editar sabor" : "Novo sabor"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço *</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              >
                <option value="tradicional">Tradicional</option>
                <option value="fitness">Fitness</option>
                <option value="vegetariana">Vegetariana</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Peso</label>
              <input
                value={form.weight}
                onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Calorias</label>
              <input
                type="number"
                value={form.calories}
                onChange={(e) =>
                  setForm((f) => ({ ...f, calories: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">URL da imagem</label>
              <input
                value={form.image_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image_url: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
              Ativo no cardápio
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
          {products.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border border-gray-100 p-4 flex items-start justify-between gap-3 ${
                !p.active ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">{p.description}</p>
                <p className="text-sm font-medium text-primary-600 mt-1">
                  R$ {Number(p.price).toFixed(2)} · {p.category}
                  {!p.active && " · inativo"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 text-gray-500 hover:text-primary-600"
                  aria-label="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {p.active && (
                  <button
                    onClick={() => handleDeactivate(p.id)}
                    className="p-2 text-gray-500 hover:text-red-600"
                    aria-label="Desativar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Nenhum produto no banco. Adicione os sabores ou rode o seed SQL.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
