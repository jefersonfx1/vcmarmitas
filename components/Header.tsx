"use client";

import Link from "next/link";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl text-primary-600">
            VC Marmitas
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Início
            </Link>
            <Link href="/cardapio" className="text-gray-700 hover:text-primary-600 transition-colors">
              Cardápio
            </Link>
            <Link href="/sobre" className="text-gray-700 hover:text-primary-600 transition-colors">
              Sobre
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/carrinho"
              className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <Link
              href="/conta"
              className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
              aria-label="Minha conta"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-3 border-t border-gray-100 pt-3">
            <Link href="/" onClick={() => setOpen(false)} className="text-gray-700 py-1">
              Início
            </Link>
            <Link href="/cardapio" onClick={() => setOpen(false)} className="text-gray-700 py-1">
              Cardápio
            </Link>
            <Link href="/sobre" onClick={() => setOpen(false)} className="text-gray-700 py-1">
              Sobre
            </Link>
            <Link href="/conta" onClick={() => setOpen(false)} className="text-gray-700 py-1">
              Minha conta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}