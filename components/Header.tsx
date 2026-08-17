"use client";

import Link from "next/link";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl text-primary-700">
            VC Marmitas
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/cardapio" className="text-gray-700 hover:text-primary-600 font-medium">
              Cardápio
            </Link>
            <Link href="/como-funciona" className="text-gray-700 hover:text-primary-600 font-medium">
              Como funciona
            </Link>
            <Link href="/contato" className="text-gray-700 hover:text-primary-600 font-medium">
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/carrinho"
              className="relative p-2 text-gray-700 hover:text-primary-600"
              aria-label="Carrinho"
            >
              <ShoppingCart size={22} />
              <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                0
              </span>
            </Link>
            <Link
              href="/conta"
              className="p-2 text-gray-700 hover:text-primary-600"
              aria-label="Minha conta"
            >
              <User size={22} />
            </Link>
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-3">
            <Link href="/cardapio" className="text-gray-700 font-medium" onClick={() => setOpen(false)}>
              Cardápio
            </Link>
            <Link href="/como-funciona" className="text-gray-700 font-medium" onClick={() => setOpen(false)}>
              Como funciona
            </Link>
            <Link href="/contato" className="text-gray-700 font-medium" onClick={() => setOpen(false)}>
              Contato
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}