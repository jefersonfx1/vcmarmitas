/** CEP, área de entrega e frete por distância */

export type AddressFromCep = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type FreightResult = {
  available: boolean;
  price: number;
  label: string;
  zone: "brasilia" | "entorno" | "fora" | null;
  distanceKm?: number;
  message?: string;
  freeShipping?: boolean;
};

/** Ponto de origem (cozinha / distribuição) — Recanto das Emas, Brasília/DF */
export const ORIGIN_CEP = "72631127";

/** Pedido a partir deste valor tem frete grátis */
export const FREE_FREIGHT_MIN = 349.9;

// Fallback coords aproximadas do Recanto das Emas (Brasília/DF)
const ORIGIN_COORDS = { lat: -15.91, lng: -48.08 };

/** Cache em memória de geocode (útil em instâncias warm do serverless) */
const geocodeCache = new Map<string, { coords: Coords; at: number }>();
const GEOCODE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

type Coords = { lat: number; lng: number };

function onlyDigits(cep: string) {
  return cep.replace(/\D/g, "");
}

function normalizeCity(city: string) {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Únicas cidades do entorno atendidas */
const ENTORNO_ALLOWED = ["valparaiso de goias", "novo gama"];

function isEntornoCity(city: string): boolean {
  const c = normalizeCity(city);
  if (!c) return false;
  return ENTORNO_ALLOWED.some(
    (allowed) => c === allowed || c.includes(allowed) || allowed.includes(c)
  );
}

function isBrasilia(city: string, state: string, cepDigits: string): boolean {
  const uf = state.toUpperCase();
  const n = parseInt(cepDigits, 10);
  const c = normalizeCity(city);
  if (uf === "DF") return true;
  if (c.includes("brasilia")) return true;
  // Faixa típica DF (evita confusão com GO 728xx+)
  if (uf !== "GO" && n >= 70000000 && n <= 72799999) return true;
  return false;
}

export async function fetchAddressByCep(
  cep: string
): Promise<AddressFromCep | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.erro) return null;

  return {
    cep: digits,
    street: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}

async function geocodeCep(
  cep: string,
  city?: string,
  state?: string
): Promise<Coords | null> {
  const digits = onlyDigits(cep);
  const cacheKey = `${digits}|${city || ""}|${state || ""}`;

  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.at < GEOCODE_TTL_MS) {
    return cached.coords;
  }

  try {
    const q =
      city && state
        ? `${digits}, ${city}, ${state}, Brasil`
        : `${digits}, Brasil`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VCMarmitas/1.0 (vcmarmitas.netlify.app)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const coords = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
    geocodeCache.set(cacheKey, { coords, at: Date.now() });
    return coords;
  } catch {
    return null;
  }
}

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Base R$ 8 + R$ 1,20/km a partir do Recanto das Emas (Brasília/DF)
 * Mínimo R$ 10 | Máximo R$ 45
 */
function priceFromDistance(km: number): number {
  const base = 8;
  const perKm = 1.2;
  let price = base + km * perKm;
  price = Math.max(10, Math.min(45, price));
  return Math.round(price * 100) / 100;
}

function assertDeliveryArea(
  digits: string,
  city: string,
  state: string
): FreightResult | null {
  if (digits.length !== 8) {
    return {
      available: false,
      price: 0,
      label: "CEP inválido",
      zone: null,
      message: "Informe um CEP válido com 8 dígitos",
    };
  }

  const brasilia = isBrasilia(city, state, digits);
  const entorno = isEntornoCity(city);

  if (city && !brasilia && !entorno) {
    return {
      available: false,
      price: 0,
      label: "Fora da área de entrega",
      zone: "fora",
      message:
        "Entregamos apenas em Brasília (DF), Valparaíso de Goiás e Novo Gama.",
    };
  }

  if (!city) {
    const n = parseInt(digits, 10);
    const maybeDf = n >= 70000000 && n <= 72799999;
    const maybeEntorno = n >= 72850000 && n <= 72899999;
    if (!maybeDf && !maybeEntorno) {
      return {
        available: false,
        price: 0,
        label: "Fora da área de entrega",
        zone: "fora",
        message:
          "Entregamos apenas em Brasília (DF), Valparaíso de Goiás e Novo Gama.",
      };
    }
  }

  return null;
}

/**
 * Aplica frete grátis quando o subtotal do pedido atinge o mínimo.
 * Não altera disponibilidade — só zera o preço e marca freeShipping.
 */
export function applyFreeFreight(
  freight: FreightResult,
  orderSubtotal: number
): FreightResult {
  if (!freight.available) return freight;
  if (orderSubtotal >= FREE_FREIGHT_MIN) {
    return {
      ...freight,
      price: 0,
      freeShipping: true,
      label: freight.distanceKm
        ? `${freight.label.replace(/ · ~\d+ km$/, "")} · Frete grátis`
        : "Frete grátis",
      message: `Frete grátis em pedidos a partir de R$ ${FREE_FREIGHT_MIN.toFixed(2).replace(".", ",")}`,
    };
  }
  return { ...freight, freeShipping: false };
}

/** Fallback síncrono (sem geocode) */
export function calcFreight(
  cep: string,
  city?: string,
  state?: string
): FreightResult {
  const digits = onlyDigits(cep);
  const blocked = assertDeliveryArea(digits, city || "", state || "");
  if (blocked) return blocked;

  const origin = parseInt(ORIGIN_CEP, 10);
  const dest = parseInt(digits, 10);
  const cepDelta = Math.abs(dest - origin);
  const approxKm = Math.min(80, Math.max(2, cepDelta / 150));
  const price = priceFromDistance(approxKm);

  const brasilia = isBrasilia(city || "", state || "", digits);
  const label = brasilia
    ? "Brasília (DF)"
    : isEntornoCity(city || "")
      ? city || "Entorno"
      : "Valparaíso / Novo Gama";

  return {
    available: true,
    price,
    label,
    zone: brasilia ? "brasilia" : "entorno",
    distanceKm: Math.round(approxKm * 10) / 10,
    freeShipping: false,
  };
}

/** Cálculo com distância real (Nominatim + Haversine) + cache de coordenadas */
export async function calcFreightSmart(
  cep: string,
  city?: string,
  state?: string,
  orderSubtotal?: number
): Promise<FreightResult> {
  const basic = calcFreight(cep, city, state);
  if (!basic.available) return basic;

  let result = basic;

  try {
    const dest = await geocodeCep(cep, city, state);
    const origin =
      (await geocodeCep(ORIGIN_CEP, "Recanto das Emas", "DF")) ||
      ORIGIN_COORDS;

    if (dest) {
      const km = haversineKm(origin, dest);
      const price = priceFromDistance(km);
      result = {
        ...basic,
        price,
        distanceKm: Math.round(km * 10) / 10,
        label: `${basic.label} · ~${Math.round(km)} km`,
      };
    }
  } catch {
    // mantém basic
  }

  if (typeof orderSubtotal === "number") {
    return applyFreeFreight(result, orderSubtotal);
  }
  return result;
}

export function formatCep(cep: string) {
  const d = onlyDigits(cep).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
