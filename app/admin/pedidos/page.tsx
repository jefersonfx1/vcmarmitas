"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  RefreshCw,
  ArrowLeft,
  ChefHat,
  Inbox,
} from "lucide-react";

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

type TabId =
  | "operacao"
  | "entrega"
  | "finalizados"
  | "cancelados"
  | "todos";

const HOURS_48 = 48 * 60 * 60 * 1000;

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
    icon: <Inbox className="w-3.5 h-3.5" />,
  },
  preparando: {
    label: "Em produção",
    color: "bg-orange-100 text-orange-800",
    icon: <ChefHat className="w-3.5 h-3.5" />,
  },
  enviado: {
    label: "Em entrega",
    color: "bg-purple-100 text-purple-800",
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  entregue: {
    label: "Finalizado",
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

function isWithin48h(iso: string) {
  return Date.now() - new Date(iso).getTime() <= HOURS_48;
}

function isOpenStatus(status: OrderStatus) {
  return status === "pendente" || status === "confirmado" || status === "preparando";
}

/** No workflow: abertos sempre; fechados nunca (ficam nas outras abas). */
function showOnBoard(order: Order) {
  if (!isOpenStatus(order.status)) return false;
  // Abertos > 48h continuam no board até finalizar/cancelar
  return true;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "operacao", label: "Operação" },
  { id: "entrega", label: "Em entrega" },
  { id: "finalizados", label: "Finalizados" },
  { id: "cancelados", label: "Cancelados" },
  { id: "todos", label: "Todos os pedidos" },
];

function OrderCard({
  order,
  onStatus,
  compact,
}: {
  order: Order;
  onStatus: (id: string, status: OrderStatus) => void;
  compact?: boolean;
}) {
  const config = statusConfig[order.status] || statusConfig.pendente;
  const itemsText = (order.order_items || [])
    .map((i) => `${i.quantity}x ${i.product_name}`)
    .join(", ");

  const nextActions: { status: OrderStatus; label: string }[] = [];
  if (order.status === "pendente") {
    nextActions.push({ status: "confirmado", label: "Confirmar" });
    nextActions.push({ status: "preparando", label: "Produção" });
  } else if (order.status === "confirmado") {
    nextActions.push({ status: "preparando", label: "Produção" });
  } else if (order.status === "preparando") {
    nextActions.push({ status: "enviado", label: "Saiu p/ entrega" });
  } else if (order.status === "enviado") {
    nextActions.push({ status: "entregue", label: "Finalizar" });
  }
  if (order.status !== "entregue" && order.status !== "cancelado") {
    nextActions.push({ status: "cancelado", label: "Cancelar" });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            {order.customer_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.id.slice(0, 8)}… · {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${config.color}`}
        >
          {config.icon}
          {config.label}
        </span>
      </div>

      {!compact && (
        <div className="text-xs text-gray-600 space-y-1 mb-3">
          <p>
            <span className="text-gray-400">WhatsApp:</span>{" "}
            {order.customer_phone || "—"}
          </p>
          <p className="line-clamp-2">
            <span className="text-gray-400">End.:</span>{" "}
            {order.address_street}, {order.address_number} — {order.address_cep}
          </p>
          <p className="line-clamp-2">
            <span className="text-gray-400">Itens:</span> {itemsText || "—"}
          </p>
        </div>
      )}

      {compact && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{itemsText || "—"}</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
        <span className="font-bold text-primary-600 text-sm">
          {formatPrice(order.total)}
        </span>
        <div className="flex flex-wrap gap-1 justify-end">
          {nextActions.map((a) => (
            <button
              key={a.status}
              type="button"
              onClick={() => onStatus(order.id, a.status)}
              className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors ${
                a.status === "cancelado"
                  ? "border-red-200 text-red-600 hover:bg-red-50"
                  : "border-primary-200 text-primary-700 hover:bg-primary-50"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {!compact && (
        <select
          value={order.status}
          onChange={(e) => onStatus(order.id, e.target.value as OrderStatus)}
          className="mt-2 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="preparando">Em produção</option>
          <option value="enviado">Em entrega</option>
          <option value="entregue">Finalizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      )}
    </div>
  );
}

function Column({
  title,
  icon,
  count,
  children,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex flex-col min-h-[320px] bg-gray-50 rounded-2xl border border-gray-100">
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 rounded-t-2xl ${accent}`}
      >
        {icon}
        <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
        <span className="ml-auto text-xs font-medium bg-white/80 text-gray-600 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh]">{children}</div>
    </div>
  );
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<TabId>("operacao");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "todos">("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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

  const boardRecebidos = useMemo(
    () =>
      orders.filter(
        (o) =>
          showOnBoard(o) &&
          (o.status === "pendente" || o.status === "confirmado")
      ),
    [orders]
  );

  const boardProducao = useMemo(
    () => orders.filter((o) => showOnBoard(o) && o.status === "preparando"),
    [orders]
  );

  const entrega = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "enviado" && (isWithin48h(o.created_at) || true)
      ),
    [orders]
  );

  const finalizados = useMemo(
    () => orders.filter((o) => o.status === "entregue"),
    [orders]
  );

  const cancelados = useMemo(
    () => orders.filter((o) => o.status === "cancelado"),
    [orders]
  );

  const todosFiltered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus =
        statusFilter === "todos" || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.customer_name.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.customer_phone || "").includes(search);
      const t = new Date(o.created_at).getTime();
      const matchFrom = !dateFrom || t >= new Date(dateFrom).setHours(0, 0, 0, 0);
      const matchTo =
        !dateTo || t <= new Date(dateTo).setHours(23, 59, 59, 999);
      return matchStatus && matchSearch && matchFrom && matchTo;
    });
  }, [orders, statusFilter, search, dateFrom, dateTo]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Painel
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Operação do dia · pedidos abertos ficam no quadro até finalizar
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? "text-primary-700 border-b-2 border-primary-600 bg-primary-50/50"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-center text-gray-500 py-16">Carregando pedidos...</p>
      )}
      {error && <p className="text-center text-red-600 py-16">{error}</p>}

      {!loading && !error && tab === "operacao" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Column
            title="Recebidos"
            icon={<Inbox className="w-4 h-4 text-blue-600" />}
            count={boardRecebidos.length}
            accent="bg-blue-50/80"
          >
            {boardRecebidos.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-8">
                Nenhum pedido recebido
              </p>
            )}
            {boardRecebidos.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={updateStatus} compact />
            ))}
          </Column>
          <Column
            title="Em produção"
            icon={<ChefHat className="w-4 h-4 text-orange-600" />}
            count={boardProducao.length}
            accent="bg-orange-50/80"
          >
            {boardProducao.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-8">
                Nada em produção
              </p>
            )}
            {boardProducao.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={updateStatus} compact />
            ))}
          </Column>
        </div>
      )}

      {!loading && !error && tab === "entrega" && (
        <div className="space-y-3 max-w-2xl">
          {entrega.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Nenhum pedido em entrega.
            </p>
          )}
          {entrega.map((o) => (
            <OrderCard key={o.id} order={o} onStatus={updateStatus} />
          ))}
        </div>
      )}

      {!loading && !error && tab === "finalizados" && (
        <div className="space-y-3 max-w-2xl">
          {finalizados.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Nenhum pedido finalizado.
            </p>
          )}
          {finalizados.map((o) => (
            <OrderCard key={o.id} order={o} onStatus={updateStatus} />
          ))}
        </div>
      )}

      {!loading && !error && tab === "cancelados" && (
        <div className="space-y-3 max-w-2xl">
          {cancelados.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Nenhum pedido cancelado.
            </p>
          )}
          {cancelados.map((o) => (
            <OrderCard key={o.id} order={o} onStatus={updateStatus} />
          ))}
        </div>
      )}

      {!loading && !error && tab === "todos" && (
        <>
          <div className="flex flex-col lg:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cliente, telefone ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "todos")
              }
              className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="preparando">Em produção</option>
              <option value="enviado">Em entrega</option>
              <option value="entregue">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="De"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Até"
            />
          </div>

          <div className="space-y-3">
            {todosFiltered.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={updateStatus} />
            ))}
            {todosFiltered.length === 0 && (
              <p className="text-center text-gray-500 py-12">
                Nenhum pedido encontrado com esses filtros.
              </p>
            )}
          </div>
        </>
      )}

      {!loading && !error && tab === "operacao" && (
        <p className="text-center text-xs text-gray-400 mt-6">
          Pedidos abertos permanecem no quadro até serem finalizados ou
          cancelados (mesmo após 48h). Entrega, finalizados e cancelados ficam
          nas abas ao lado.
        </p>
      )}
    </div>
  );
}
