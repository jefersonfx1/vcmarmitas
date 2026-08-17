"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Clock, CheckCircle, XCircle, Search } from "lucide-react";

type OrderStatus = "pendente" | "confirmado" | "preparando" | "enviado" | "entregue" | "cancelado";

type Order = {
  id: string;
  customer: string;
  phone: string;
  total: number;
  status: OrderStatus;
  items: string;
  createdAt: string;
};

// Dados mockados (depois virão do Supabase)
const mockOrders: Order[] = [
  {
    id: "PED-001",
    customer: "Maria Silva",
    phone: "(11) 98765-4321",
    total: 72.7,
    status: "pendente",
    items: "2x Frango Grelhado, 1x Strogonoff",
    createdAt: "2026-08-17 14:32",
  },
  {
    id: "PED-002",
    customer: "João Santos",
    phone: "(11) 91234-5678",
    total: 49.8,
    status: "confirmado",
    items: "1x Salmão com Quinoa, 1x Risoto",
    createdAt: "2026-08-17 13:15",
  },
  {
    id: "PED-003",
    customer: "Ana Costa",
    phone: "(11) 99876-5432",
    total: 26.9,
    status: "preparando",
    items: "1x Feijoada Light",
    createdAt: "2026-08-17 12:48",
  },
  {
    id: "PED-004",
    customer: "Carlos Oliveira",
    phone: "(11) 97654-3210",
    total: 91.6,
    status: "enviado",
    items: "2x Carne Assada, 1x Frango, 1x Strogonoff",
    createdAt: "2026-08-17 11:20",
  },
];

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
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [search, setSearch] = useState("");

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "todos" || o.status === filter;
    const matchSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  function updateStatus(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-gray-600 mt-1">Gerencie os pedidos da loja</p>
        </div>
        <Link
          href="/"
          className="text-sm text-primary-600 hover:underline"
        >
          ← Voltar à loja
        </Link>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente ou pedido..."
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

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {filtered.map((order) => {
          const config = statusConfig[order.status];
          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{order.id}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${config.color}`}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{order.createdAt}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Cliente:</span>{" "}
                  <span className="font-medium">{order.customer}</span>
                </div>
                <div>
                  <span className="text-gray-500">WhatsApp:</span>{" "}
                  <span className="font-medium">{order.phone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Itens:</span>{" "}
                  <span>{order.items}</span>
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

      <p className="text-xs text-gray-400 text-center mt-8">
        Dados mockados. Em breve integração com Supabase.
      </p>
    </div>
  );
}