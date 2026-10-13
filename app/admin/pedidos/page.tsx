"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  RefreshCw,
  ArrowLeft,
  ChefHat,
  Inbox,
  Printer,
  MoreVertical,
  Bell,
  BellOff,
} from "lucide-react";
import {
  type Order,
  type OrderStatus,
  formatPrice,
  formatDate,
  playBell,
  printThermalReceipt,
} from "@/lib/admin-order-print";

type TabId =
  | "operacao"
  | "entrega"
  | "finalizados"
  | "cancelados"
  | "todos";

const ALL_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pendente", label: "Pendente (Recebidos)" },
  { value: "confirmado", label: "Confirmado (Recebidos)" },
  { value: "preparando", label: "Em producao" },
  { value: "enviado", label: "Em entrega" },
  { value: "entregue", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
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
    icon: <Inbox className="w-3.5 h-3.5" />,
  },
  preparando: {
    label: "Em producao",
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

function isOpenStatus(status: OrderStatus) {
  return (
    status === "pendente" || status === "confirmado" || status === "preparando"
  );
}

function showOnBoard(order: Order) {
  return isOpenStatus(order.status);
}

const TABS: { id: TabId; label: string }[] = [
  { id: "operacao", label: "Operacao" },
  { id: "entrega", label: "Em entrega" },
  { id: "finalizados", label: "Finalizados" },
  { id: "cancelados", label: "Cancelados" },
  { id: "todos", label: "Todos os pedidos" },
];

function StatusMenu({
  order,
  onStatus,
}: {
  order: Order;
  onStatus: (id: string, status: OrderStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        aria-label="Alterar status"
        title="Mover para..."
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Mover para
          </p>
          {ALL_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={order.status === s.value}
              onClick={() => {
                onStatus(order.id, s.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default ${
                order.status === s.value
                  ? "font-semibold text-primary-700"
                  : "text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onStatus,
  onPrint,
  compact,
  showPrint,
}: {
  order: Order;
  onStatus: (id: string, status: OrderStatus) => void;
  onPrint: (order: Order) => void;
  compact?: boolean;
  showPrint?: boolean;
}) {
  const config = statusConfig[order.status] || statusConfig.pendente;
  const itemsText = (order.order_items || [])
    .map((i) => `${i.quantity}x ${i.product_name}`)
    .join(", ");

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm relative">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            {order.customer_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.id.slice(0, 8)}… · {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${config.color}`}
          >
            {config.icon}
            {config.label}
          </span>
          <StatusMenu order={order} onStatus={onStatus} />
        </div>
      </div>

      {!compact && (
        <div className="text-xs text-gray-600 space-y-1 mb-3">
          <p>
            <span className="text-gray-400">WhatsApp:</span>{" "}
            {order.customer_phone || "—"}
          </p>
          <p className="line-clamp-2">
            <span className="text-gray-400">End.:</span>{" "}
            {order.address_street}, {order.address_number}
            {order.address_complement ? `, ${order.address_complement}` : ""}
            {order.address_neighborhood
              ? ` — ${order.address_neighborhood}`
              : ""}{" "}
            — CEP {order.address_cep}
          </p>
          <p className="line-clamp-2">
            <span className="text-gray-400">Itens:</span> {itemsText || "—"}
          </p>
        </div>
      )}

      {compact && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
          {itemsText || "—"}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
        <span className="font-bold text-primary-600 text-sm">
          {formatPrice(order.total)}
        </span>

        {showPrint && (
          <button
            type="button"
            onClick={() => onPrint(order)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        )}

        {!showPrint && order.status === "preparando" && (
          <button
            type="button"
            onClick={() => onStatus(order.id, "enviado")}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50"
          >
            Saiu p/ entrega
          </button>
        )}

        {!showPrint && order.status === "enviado" && (
          <button
            type="button"
            onClick={() => onStatus(order.id, "entregue")}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
          >
            Finalizar
          </button>
        )}
      </div>
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
      <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
        {children}
      </div>
    </div>
  );
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<TabId>("operacao");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "todos">(
    "todos"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [soundOn, setSoundOn] = useState(true);

  const knownIdsRef = useRef<Set<string> | null>(null);
  const tabRef = useRef(tab);
  const soundRef = useRef(soundOn);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  const loadOrders = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar");
      const list: Order[] = data.orders || [];

      if (knownIdsRef.current === null) {
        knownIdsRef.current = new Set(list.map((o) => o.id));
      } else {
        const prev = knownIdsRef.current;
        const newcomers = list.filter((o) => !prev.has(o.id));
        if (
          newcomers.length > 0 &&
          soundRef.current &&
          tabRef.current === "operacao"
        ) {
          playBell();
        }
        knownIdsRef.current = new Set(list.map((o) => o.id));
      }

      setOrders(list);
    } catch (err) {
      if (!opts?.silent) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar pedidos"
        );
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const id = setInterval(() => {
      loadOrders({ silent: true });
    }, 20000);
    return () => clearInterval(id);
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

  async function handlePrint(order: Order) {
    const ok = printThermalReceipt(order);
    if (!ok) return;
    if (order.status !== "preparando") {
      await updateStatus(order.id, "preparando");
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
    () => orders.filter((o) => o.status === "enviado"),
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
      const matchFrom =
        !dateFrom || t >= new Date(dateFrom).setHours(0, 0, 0, 0);
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
            Imprima o cupom - o pedido vai para producao automaticamente
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            type="button"
            onClick={() => setSoundOn((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border ${
              soundOn
                ? "border-primary-200 text-primary-700 bg-primary-50"
                : "border-gray-200 text-gray-500"
            }`}
            title={soundOn ? "Som ligado" : "Som desligado"}
          >
            {soundOn ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            {soundOn ? "Campainha on" : "Campainha off"}
          </button>
          <button
            onClick={() => loadOrders()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

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
              <OrderCard
                key={o.id}
                order={o}
                onStatus={updateStatus}
                onPrint={handlePrint}
                compact
                showPrint
              />
            ))}
          </Column>
          <Column
            title="Em producao"
            icon={<ChefHat className="w-4 h-4 text-orange-600" />}
            count={boardProducao.length}
            accent="bg-orange-50/80"
          >
            {boardProducao.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-8">
                Nada em producao
              </p>
            )}
            {boardProducao.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onStatus={updateStatus}
                onPrint={handlePrint}
                compact
              />
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
            <OrderCard
              key={o.id}
              order={o}
              onStatus={updateStatus}
              onPrint={handlePrint}
            />
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
            <OrderCard
              key={o.id}
              order={o}
              onStatus={updateStatus}
              onPrint={handlePrint}
            />
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
            <OrderCard
              key={o.id}
              order={o}
              onStatus={updateStatus}
              onPrint={handlePrint}
            />
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
              <option value="preparando">Em producao</option>
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
              title="Ate"
            />
          </div>

          <div className="space-y-3">
            {todosFiltered.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onStatus={updateStatus}
                onPrint={handlePrint}
                showPrint={o.status === "pendente" || o.status === "confirmado"}
              />
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
        <p className="text-center text-xs text-gray-400 mt-6 max-w-xl mx-auto">
          <strong>Imprimir</strong> envia o cupom termico e move o pedido para{" "}
          <em>Em producao</em>. Use os <strong>tres pontinhos</strong> para mudar
          o status a qualquer momento. A campainha toca a cada novo pedido
          (atualiza a cada 20s) com a aba Operacao aberta.
        </p>
      )}
    </div>
  );
}
