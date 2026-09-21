"use client";

import Link from "next/link";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-store";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Evita hydration mismatch: carrinho só existe no client (localStorage)
  const [mounted, setMounted] = useState(false);
  const totalItems = useCart((s) => s.totalItems);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const count = mounted ? totalItems() : 0;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-lg border-b border-gray-100/80 shadow-sm"
          : "bg-white border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-[4.25rem]">
          <Link
            href="/"
            className="font-bold text-xl tracking-tight text-primary-600 hover:text-primary-700 transition-colors"
          >
            VC<span className="text-gray-900"> Marmitas</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/", label: "Início" },
              { href: "/#kits", label: "Kits" },
              { href: "/sobre", label: "Sobre" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/carrinho"
              className="relative p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute top-1 right-1 bg-primary-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm ring-2 ring-white animate-fade-in">
                  {count}
                </span>
              )}
            </Link>
            <Link
              href="/conta"
              className="p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
              aria-label="Minha conta"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              className="md:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-1 border-t border-gray-100 pt-3 animate-fade-up">
            {[
              { href: "/", label: "Início" },
              { href: "/#kits", label: "Kits" },
              { href: "/sobre", label: "Sobre" },
              { href: "/conta", label: "Minha conta" },
              { href: "/carrinho", label: "Carrinho" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-gray-700 font-medium py-2.5 px-3 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
