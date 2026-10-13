"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  ArrowLeft,
  Pause,
  Play,
  Upload,
  ImageIcon,
} from "lucide-react";

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

type Category = {
  id: string;
  slug: string;
  name: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (!prodRes.ok) throw new Error(prodData.error);
      setProducts(prodData.products || []);
      setCategories(
        (catData.categories || []).filter(
          (c: Category) => c.active !== false
        )
      );
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
    const defaultCat = categories[0]?.slug || "tradicional";
    setForm({ ...emptyForm, category: defaultCat });
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

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload");
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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

  async function toggleActive(p: Product) {
    const next = !p.active;
    const label = next ? "reativar" : "pausar";
    if (!confirm(`Deseja ${label} "${p.name}"?`)) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, active: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status");
    }
  }

  const catLabel = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name || slug;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Painel
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Sabores / Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload de imagem, categorias e pausar itens indisponíveis
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/categorias"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50"
          >
            Categorias
          </Link>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Novo sabor
          </button>
        </div>
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
                {categories.length === 0 && (
                  <>
                    <option value="tradicional">Tradicional</option>
                    <option value="fitness">Fitness</option>
                    <option value="vegetariana">Vegetariana</option>
                  </>
                )}
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
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

            {/* Upload de imagem */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Imagem</label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-28 h-28 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                  {form.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? "Enviando..." : "Enviar imagem"}
                  </button>
                  <p className="text-xs text-gray-500">
                    JPG, PNG ou WebP · máx. 5 MB · salva no Supabase Storage
                  </p>
                  <input
                    value={form.image_url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, image_url: e.target.value }))
                    }
                    placeholder="ou cole uma URL"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
              Disponível no cardápio (ativo)
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || uploading}
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
                !p.active ? "opacity-60 bg-gray-50" : ""
              }`}
            >
              <div className="flex gap-3 min-w-0">
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{p.description}</p>
                  <p className="text-sm font-medium text-primary-600 mt-1">
                    R$ {Number(p.price).toFixed(2)} · {catLabel(p.category)}
                    {!p.active && (
                      <span className="ml-2 text-amber-600 font-semibold">
                        · PAUSADO
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 text-gray-500 hover:text-primary-600"
                  aria-label="Editar"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(p)}
                  className={`p-2 ${
                    p.active
                      ? "text-gray-500 hover:text-amber-600"
                      : "text-green-600 hover:text-green-700"
                  }`}
                  aria-label={p.active ? "Pausar" : "Reativar"}
                  title={p.active ? "Pausar (indisponível)" : "Reativar"}
                >
                  {p.active ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
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
