"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Clock, CheckCircle, XCircle, Search, RefreshCw } from "lucide-react";

type OrderStatus =
  | "pendente"
  | "confirmado"
  | "preparando"
  | "enviado"
  | "entregue"
  | "cancelado";

type OrderItem = {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total: number;
  status: OrderStatus;
  address_street: string;
  address_number: string;
  address_cep: string;
  created_at: string;
  order_items: OrderItem[];
};

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pendente: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  confirmado: {
    label: "Confirmado",
    color: "bg-blue-100 text-blue-800",
    icon: <Package className="w-3.5 h-3.5" />,
  },
  preparando: {
    label: "Preparando",
    color: "bg-orange-100 text-orange-800",
    icon: <Package className="w-3.5 h-3.5" />,
  },
  enviado: {
    label: "Enviado",
    color: "bg-purple-100 text-purple-800",
    icon: <Package className="w-3.5 h-3.5" />,
  },
  entregue: {
    label: "Entregue",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function formatPrice(value: number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar");

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar status");
    }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "todos" || o.status === filter;
    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-gray-600 mt-1">Gerencie os pedidos da loja</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/produtos"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            Sabores / Produtos
          </Link>
          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <Link href="/" className="text-sm text-primary-600 hover:underline">
            ← Loja
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, telefone ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "todos")}
          className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="preparando">Preparando</option>
          <option value="enviado">Enviado</option>
          <option value="entregue">Entregue</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {loading && (
        <p className="text-center text-gray-500 py-12">Carregando pedidos...</p>
      )}

      {error && (
        <p className="text-center text-red-600 py-12">{error}</p>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filtered.map((order) => {
            const config = statusConfig[order.status];
            const itemsText = (order.order_items || [])
              .map((i) => `${i.quantity}x ${i.product_name}`)
              .join(", ");

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">
                      {order.id.slice(0, 8)}...
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${config.color}`}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Cliente:</span>{" "}
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">WhatsApp:</span>{" "}
                    <span className="font-medium">{order.customer_phone}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Endereço:</span>{" "}
                    <span>
                      {order.address_street}, {order.address_number} — CEP{" "}
                      {order.address_cep}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Itens:</span>{" "}
                    <span>{itemsText || "—"}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
                  <span className="font-bold text-primary-600 text-lg">
                    {formatPrice(order.total)}
                  </span>

                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value as OrderStatus)
                    }
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="preparando">Preparando</option>
                    <option value="enviado">Enviado</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Nenhum pedido encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
