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

/** Frete mínimo (mesmo no CEP de origem / distâncias curtas) */
export const MIN_FREIGHT = 10;

/** Frete máximo */
export const MAX_FREIGHT = 45;

/** Abaixo desta distância (km), aplica frete mínimo e trata como entrega local */
const LOCAL_DISTANCE_KM = 2;

// Coords fixas da origem — NÃO geocodificar a origem via Nominatim
const ORIGIN_COORDS = { lat: -15.91, lng: -48.08 };

/** Cache em memória de geocode */
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
  if (uf !== "GO" && n >= 70000000 && n <= 72799999) return true;
  return false;
}

/**
 * CEP vizinho / mesmo setor / mesmo bairro da cozinha → entrega local.
 * Nominatim costuma errar CEPs próximos (ex.: 72631-128 vira ~24 km).
 */
function isNearOrigin(digits: string, neighborhood?: string): boolean {
  if (digits === ORIGIN_CEP) return true;

  // Mesmo prefixo de 5 dígitos (setor do Correios) — ex.: 72631-xxx
  if (digits.slice(0, 5) === ORIGIN_CEP.slice(0, 5)) return true;

  // Delta numérico pequeno (CEP quase sequencial)
  const delta = Math.abs(parseInt(digits, 10) - parseInt(ORIGIN_CEP, 10));
  if (delta <= 100) return true;

  // Mesmo bairro da cozinha
  const bairro = normalizeCity(neighborhood || "");
  if (bairro.includes("recanto das emas")) return true;

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

async function geocodeAddress(opts: {
  cep: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}): Promise<Coords | null> {
  const digits = onlyDigits(opts.cep);

  if (digits === ORIGIN_CEP || isNearOrigin(digits, opts.neighborhood)) {
    return ORIGIN_COORDS;
  }

  const cacheKey = [
    digits,
    opts.street || "",
    opts.neighborhood || "",
    opts.city || "",
    opts.state || "",
  ].join("|");

  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.at < GEOCODE_TTL_MS) {
    return cached.coords;
  }

  try {
    // Query mais específica → melhor precisão no Nominatim
    const parts = [
      opts.street,
      opts.neighborhood,
      opts.city,
      opts.state,
      digits,
      "Brasil",
    ].filter(Boolean);
    const q = parts.join(", ");

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
  const effectiveKm = Math.max(0, km);
  if (effectiveKm <= LOCAL_DISTANCE_KM) {
    return MIN_FREIGHT;
  }
  let price = base + effectiveKm * perKm;
  price = Math.max(MIN_FREIGHT, Math.min(MAX_FREIGHT, price));
  return Math.round(price * 100) / 100;
}

function zoneLabel(city: string, state: string, digits: string): {
  label: string;
  zone: "brasilia" | "entorno";
} {
  const brasilia = isBrasilia(city, state, digits);
  if (brasilia) {
    return { label: "Brasília (DF)", zone: "brasilia" };
  }
  return {
    label: isEntornoCity(city) ? city || "Entorno" : "Valparaíso / Novo Gama",
    zone: "entorno",
  };
}

function localFreightResult(
  label: string,
  zone: "brasilia" | "entorno"
): FreightResult {
  return {
    available: true,
    price: MIN_FREIGHT,
    label: `${label} · entrega local`,
    zone,
    distanceKm: 0,
    freeShipping: false,
  };
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
      label: freight.distanceKm != null
        ? `${String(freight.label)
            .replace(/ · ~[\d.]+ km$/, "")
            .replace(/ · entrega local$/, "")
            .replace(/ · Frete grátis$/, "")} · Frete grátis`
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
  state?: string,
  neighborhood?: string
): FreightResult {
  const digits = onlyDigits(cep);
  const blocked = assertDeliveryArea(digits, city || "", state || "");
  if (blocked) return blocked;

  const { label, zone } = zoneLabel(city || "", state || "", digits);

  if (isNearOrigin(digits, neighborhood)) {
    return localFreightResult(label, zone);
  }

  // Estimativa grosseira só como fallback (geocode costuma sobrescrever)
  const origin = parseInt(ORIGIN_CEP, 10);
  const dest = parseInt(digits, 10);
  const cepDelta = Math.abs(dest - origin);
  // Escala mais conservadora para DF (CEPs próximos ≠ dezenas de km)
  const approxKm = Math.min(45, Math.max(3, Math.sqrt(cepDelta) / 8));
  const price = priceFromDistance(approxKm);

  return {
    available: true,
    price,
    label: `${label} · ~${Math.round(approxKm)} km`,
    zone,
    distanceKm: Math.round(approxKm * 10) / 10,
    freeShipping: false,
  };
}

/** Cálculo com distância real + regras de proximidade */
export async function calcFreightSmart(
  cep: string,
  city?: string,
  state?: string,
  orderSubtotal?: number,
  neighborhood?: string,
  street?: string
): Promise<FreightResult> {
  const digits = onlyDigits(cep);
  const basic = calcFreight(cep, city, state, neighborhood);
  if (!basic.available) return basic;

  // Vizinho / mesmo setor / Recanto das Emas → sempre mínimo
  if (isNearOrigin(digits, neighborhood)) {
    const result = localFreightResult(
      basic.label.replace(/ · .*$/, "") || "Brasília (DF)",
      basic.zone || "brasilia"
    );
    if (typeof orderSubtotal === "number") {
      return applyFreeFreight(result, orderSubtotal);
    }
    return result;
  }

  let result = basic;

  try {
    const dest = await geocodeAddress({
      cep: digits,
      street,
      neighborhood,
      city,
      state,
    });
    const origin = ORIGIN_COORDS;

    if (dest) {
      let km = haversineKm(origin, dest);

      // Nominatim às vezes devolve ponto genérico longe demais
      if (km > 60) {
        km = basic.distanceKm ?? 25;
      }

      // Se geocode ainda “inventou” distância alta para CEP relativamente próximo, corta
      const cepDelta = Math.abs(parseInt(digits, 10) - parseInt(ORIGIN_CEP, 10));
      if (cepDelta < 5000 && km > 15) {
        km = Math.min(km, 8);
      }

      const price = priceFromDistance(km);
      const roundedKm = Math.round(km * 10) / 10;

      result = {
        ...basic,
        price,
        distanceKm: roundedKm,
        label:
          roundedKm <= LOCAL_DISTANCE_KM
            ? `${basic.label.replace(/ · .*$/, "")} · entrega local`
            : `${basic.label.replace(/ · .*$/, "")} · ~${Math.round(km)} km`,
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
