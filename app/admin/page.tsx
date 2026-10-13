"use client";

import Link from "next/link";
import {
  Package,
  Tags,
  Ticket,
  ClipboardList,
  Store,
  ArrowRight,
} from "lucide-react";

const cards = [
  {
    href: "/admin/pedidos",
    title: "Pedidos",
    description:
      "Workflow estilo kanban: recebidos, produção, entrega e histórico.",
    icon: ClipboardList,
    color: "bg-orange-50 text-orange-700 ring-orange-100",
    iconBg: "bg-orange-100",
  },
  {
    href: "/admin/produtos",
    title: "Cardápio",
    description:
      "Sabores, preços, fotos, pausar itens indisponíveis e publicar novos.",
    icon: Package,
    color: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    iconBg: "bg-emerald-100",
  },
  {
    href: "/admin/categorias",
    title: "Categorias",
    description: "Organize o cardápio: tradicional, fitness, vegetariana e novas.",
    icon: Tags,
    color: "bg-blue-50 text-blue-700 ring-blue-100",
    iconBg: "bg-blue-100",
  },
  {
    href: "/admin/cupons",
    title: "Cupons",
    description:
      "Descontos de frete, limites por usuário e cupons de primeira compra.",
    icon: Ticket,
    color: "bg-violet-50 text-violet-700 ring-violet-100",
    iconBg: "bg-violet-100",
  },
];

export default function AdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-gray-600 mt-1">
            Central de operações da VC Marmitas
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
        >
          <Store className="w-4 h-4" />
          Voltar à loja
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all ring-1 ring-transparent hover:ring-primary-200`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {card.title}
                    </h2>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-10">
        Dica: use <strong>Pedidos</strong> no dia a dia e as outras seções para
        configurar o cardápio e promoções.
      </p>
    </div>
  );
}
