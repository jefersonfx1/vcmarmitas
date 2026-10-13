"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, ArrowLeft, Pause, Play } from "lucide-react";

type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  active: boolean;
};

const emptyForm = { name: "", slug: "", sort_order: "0", active: true };

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(data.categories || []);
      if (data.warning) setError(`Aviso: rode o SQL admin-catalog.sql — ${data.warning}`);
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

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      sort_order: String(c.sort_order ?? 0),
      active: c.active,
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
        slug: form.slug || undefined,
        sort_order: Number(form.sort_order) || 0,
        active: form.active,
      };
      const res = await fetch("/api/admin/categories", {
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

  async function toggleActive(c: Category) {
    const next = !c.active;
    if (!confirm(`${next ? "Reativar" : "Pausar"} categoria "${c.name}"?`)) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, active: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin/produtos"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Produtos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize os sabores (ex.: Tradicional, Fitness)
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nova categoria
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-xl">{error}</div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 space-y-4"
        >
          <h2 className="font-semibold text-lg">
            {editing ? "Editar categoria" : "Nova categoria"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                placeholder="Ex: Fitness"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                placeholder="auto a partir do nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ordem</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: e.target.value }))
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
              Ativa
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
          {categories.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3 ${
                !c.active ? "opacity-60" : ""
              }`}
            >
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500">
                  slug: {c.slug} · ordem {c.sort_order}
                  {!c.active && (
                    <span className="text-amber-600 font-medium"> · pausada</span>
                  )}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 text-gray-500 hover:text-primary-600"
                  aria-label="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  className={`p-2 ${
                    c.active
                      ? "text-gray-500 hover:text-amber-600"
                      : "text-green-600"
                  }`}
                  aria-label={c.active ? "Pausar" : "Reativar"}
                >
                  {c.active ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Nenhuma categoria. Rode o SQL supabase/admin-catalog.sql.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
