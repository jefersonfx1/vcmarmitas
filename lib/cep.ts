/**
 * Frete por distância (km) a partir da cozinha.
 *
 * Origem: CEP 72631-127 — Recanto das Emas (coords fixas).
 * 1) Valida área (DF + Valparaíso + Novo Gama)
 * 2) Obtém coordenadas do destino (BrasilAPI → centroide por região)
 * 3) Haversine → km médio
 * 4) Preço = base + (km × tarifa), com piso e teto
 */

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
  zone: "local" | "df" | "entorno" | "fora" | null;
  message?: string;
  freeShipping?: boolean;
  distanceKm?: number;
};

export const ORIGIN_CEP = "72631127";

/** Coordenadas reais da cozinha (Recanto das Emas — Quadra 405) */
export const ORIGIN_COORDS = {
  lat: -15.9028,
  lng: -48.0975,
} as const;

export const FREE_FREIGHT_MIN = 349.9;

/** Parâmetros do preço por km (ajustáveis) */
export const FREIGHT_PRICING = {
  base: 8, // R$
  perKm: 1.4, // R$/km
  min: 10,
  max: 35,
} as const;

function onlyDigits(cep: string) {
  return String(cep || "").replace(/\D/g, "");
}

function normalize(text: string) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const CEP_RANGES = {
  recanto: { min: 72600000, max: 72699999 },
  df: { min: 70000000, max: 72799999 },
  novoGama: { min: 72860000, max: 72869999 },
  valparaiso: { min: 72870000, max: 72879999 },
} as const;

function inRange(n: number, min: number, max: number) {
  return n >= min && n <= max;
}

function isRecanto(city: string, neighborhood: string, n: number) {
  const c = normalize(city);
  const b = normalize(neighborhood);
  if (b.includes("recanto das emas") || c.includes("recanto das emas")) return true;
  return inRange(n, CEP_RANGES.recanto.min, CEP_RANGES.recanto.max);
}

function isNovoGama(city: string, n: number) {
  return normalize(city).includes("novo gama") ||
    inRange(n, CEP_RANGES.novoGama.min, CEP_RANGES.novoGama.max);
}

function isValparaiso(city: string, n: number) {
  return normalize(city).includes("valparaiso") ||
    inRange(n, CEP_RANGES.valparaiso.min, CEP_RANGES.valparaiso.max);
}

function isDf(city: string, state: string, n: number) {
  if (state.toUpperCase() === "DF") return true;
  if (normalize(city).includes("brasilia")) return true;
  return inRange(n, CEP_RANGES.df.min, CEP_RANGES.df.max);
}

/** Centroides aproximados (lat, lng) por região — fallback quando geocode é genérico */
const REGION_CENTROIDS: { match: (n: number, city: string, bairro: string) => boolean; lat: number; lng: number; name: string }[] = [
  {
    name: "Recanto das Emas",
    lat: -15.9028,
    lng: -48.0975,
    match: (n, _c, b) =>
      inRange(n, 72600000, 72699999) || normalize(b).includes("recanto das emas"),
  },
  {
    name: "Samambaia",
    lat: -15.8755,
    lng: -48.0865,
    match: (n, _c, b) =>
      inRange(n, 72300000, 72329999) || normalize(b).includes("samambaia"),
  },
  {
    name: "Ceilândia",
    lat: -15.8267,
    lng: -48.1081,
    match: (n, _c, b) =>
      inRange(n, 72200000, 72249999) || normalize(b).includes("ceilandia"),
  },
  {
    name: "Taguatinga",
    lat: -15.8339,
    lng: -48.0567,
    match: (n, _c, b) =>
      inRange(n, 72000000, 72199999) || normalize(b).includes("taguatinga"),
  },
  {
    name: "Águas Claras",
    lat: -15.8372,
    lng: -48.0267,
    match: (n, _c, b) =>
      inRange(n, 71900000, 71999999) || normalize(b).includes("aguas claras"),
  },
  {
    name: "Gama",
    lat: -16.0205,
    lng: -48.0637,
    match: (n, _c, b) =>
      inRange(n, 72400000, 72449999) || normalize(b).includes("gama"),
  },
  {
    name: "Santa Maria",
    lat: -16.0117,
    lng: -48.0139,
    match: (n, _c, b) =>
      inRange(n, 72500000, 72599999) || normalize(b).includes("santa maria"),
  },
  {
    name: "Núcleo Bandeirante / Park Way",
    lat: -15.8705,
    lng: -47.9675,
    match: (n) => inRange(n, 71700000, 71799999),
  },
  {
    name: "Guará",
    lat: -15.8255,
    lng: -47.9845,
    match: (n, _c, b) =>
      inRange(n, 71000000, 71099999) || normalize(b).includes("guara"),
  },
  {
    name: "Cruzeiro / Sudoeste",
    lat: -15.7955,
    lng: -47.9365,
    match: (n) => inRange(n, 70600000, 70699999),
  },
  {
    name: "Asa Sul",
    lat: -15.8125,
    lng: -47.9125,
    match: (n) => inRange(n, 70200000, 70399999),
  },
  {
    name: "Asa Norte",
    lat: -15.7555,
    lng: -47.8825,
    match: (n) => inRange(n, 70000000, 70199999) || inRange(n, 70700000, 70899999),
  },
  {
    name: "Lago Sul / Norte",
    lat: -15.8355,
    lng: -47.8555,
    match: (n) => inRange(n, 71500000, 71699999),
  },
  {
    name: "Sobradinho",
    lat: -15.6515,
    lng: -47.7895,
    match: (n, _c, b) =>
      inRange(n, 73000000, 73099999) || normalize(b).includes("sobradinho"),
  },
  {
    name: "Planaltina (DF)",
    lat: -15.4525,
    lng: -47.6145,
    match: (n, _c, b) =>
      inRange(n, 73300000, 73399999) || normalize(b).includes("planaltina"),
  },
  {
    name: "Novo Gama",
    lat: -16.0595,
    lng: -48.0395,
    match: (n, c) => isNovoGama(c, n),
  },
  {
    name: "Valparaíso de Goiás",
    lat: -16.0685,
    lng: -47.9765,
    match: (n, c) => isValparaiso(c, n),
  },
];

/** Centro genérico de Brasília (BrasilAPI costuma devolver isto) */
const BRASILIA_CENTER = { lat: -15.77972, lng: -47.92972 };

function almostSame(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  eps = 0.02
) {
  return Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function priceFromKm(km: number): number {
  const raw = FREIGHT_PRICING.base + km * FREIGHT_PRICING.perKm;
  const clamped = Math.max(
    FREIGHT_PRICING.min,
    Math.min(FREIGHT_PRICING.max, raw)
  );
  return Math.round(clamped * 100) / 100;
}

function centroidFor(
  n: number,
  city: string,
  neighborhood: string
): { lat: number; lng: number; name: string } | null {
  for (const r of REGION_CENTROIDS) {
    if (r.match(n, city, neighborhood)) {
      return { lat: r.lat, lng: r.lng, name: r.name };
    }
  }
  // DF genérico (outras RAs)
  if (isDf(city, "DF", n) && !inRange(n, 72860000, 72879999)) {
    return { lat: -15.78, lng: -47.93, name: "Brasília" };
  }
  return null;
}

export async function fetchAddressByCep(
  cep: string
): Promise<AddressFromCep | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        return {
          cep: digits,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        };
      }
    }
  } catch {
    /* fallback */
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        cep: digits,
        street: data.street || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
      };
    }
  } catch {
    /* ignore */
  }

  return null;
}

async function fetchCoordsFromBrasilApi(
  digits: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.location?.coordinates;
    if (!coords) return null;
    const lat = parseFloat(coords.latitude);
    const lng = parseFloat(coords.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function classifyZone(
  digits: string,
  city: string,
  state: string,
  neighborhood: string
): FreightResult["zone"] {
  const n = parseInt(digits, 10);
  if (isRecanto(city, neighborhood, n)) return "local";
  if (isNovoGama(city, n) || isValparaiso(city, n)) return "entorno";
  if (isDf(city, state, n)) return "df";
  return "fora";
}

function zoneLabel(zone: FreightResult["zone"], city: string): string {
  if (zone === "local") return "Recanto das Emas";
  if (zone === "entorno") return city || "Entorno";
  if (zone === "df") return city ? `Brasília · ${city}` : "Brasília (DF)";
  return "Fora da área";
}

/**
 * Calcula frete por km a partir da origem.
 */
export async function calcFreightByDistance(
  cep: string,
  city?: string,
  state?: string,
  neighborhood?: string
): Promise<FreightResult> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    return {
      available: false,
      price: 0,
      label: "CEP inválido",
      zone: null,
      message: "Informe um CEP válido com 8 dígitos",
    };
  }

  const n = parseInt(digits, 10);
  const cityN = city || "";
  const stateN = state || "";
  const bairroN = neighborhood || "";

  const zone = classifyZone(digits, cityN, stateN, bairroN);
  if (zone === "fora") {
    return {
      available: false,
      price: 0,
      label: "Fora da área de entrega",
      zone: "fora",
      message:
        "Entregamos apenas em Brasília (DF), Valparaíso de Goiás e Novo Gama.",
    };
  }

  // Coordenadas do destino
  let dest = await fetchCoordsFromBrasilApi(digits);

  // Se veio o centro genérico de Brasília e o CEP não é plano piloto, usa centroide
  if (dest && almostSame(dest, BRASILIA_CENTER)) {
    const c = centroidFor(n, cityN, bairroN);
    if (c) dest = { lat: c.lat, lng: c.lng };
  }

  if (!dest) {
    const c = centroidFor(n, cityN, bairroN);
    if (c) dest = { lat: c.lat, lng: c.lng };
  }

  // Fallback final: preço mínimo se não geocodificar
  if (!dest) {
    return {
      available: true,
      price: FREIGHT_PRICING.min,
      label: zoneLabel(zone, cityN),
      zone,
      distanceKm: undefined,
      freeShipping: false,
      message: "Distância estimada indisponível — frete mínimo aplicado",
    };
  }

  const kmRaw = haversineKm(
    ORIGIN_COORDS.lat,
    ORIGIN_COORDS.lng,
    dest.lat,
    dest.lng
  );
  // Arredonda 1 casa (km médio)
  const km = Math.round(kmRaw * 10) / 10;
  const price = priceFromKm(km);

  return {
    available: true,
    price,
    label: `${zoneLabel(zone, cityN)} · ~${km.toFixed(1).replace(".", ",")} km`,
    zone,
    distanceKm: km,
    freeShipping: false,
  };
}

/** Síncrono legado (zona fixa) — mantido para compat */
export function calcFreight(
  cep: string,
  city?: string,
  state?: string,
  neighborhood?: string
): FreightResult {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    return {
      available: false,
      price: 0,
      label: "CEP inválido",
      zone: null,
      message: "Informe um CEP válido com 8 dígitos",
    };
  }
  const n = parseInt(digits, 10);
  const zone = classifyZone(digits, city || "", state || "", neighborhood || "");
  if (zone === "fora") {
    return {
      available: false,
      price: 0,
      label: "Fora da área de entrega",
      zone: "fora",
      message:
        "Entregamos apenas em Brasília (DF), Valparaíso de Goiás e Novo Gama.",
    };
  }
  // Sem km: usa estimativa pelo centroide
  const c = centroidFor(n, city || "", neighborhood || "");
  if (c) {
    const km =
      Math.round(
        haversineKm(ORIGIN_COORDS.lat, ORIGIN_COORDS.lng, c.lat, c.lng) * 10
      ) / 10;
    return {
      available: true,
      price: priceFromKm(km),
      label: `${zoneLabel(zone, city || "")} · ~${km.toFixed(1).replace(".", ",")} km`,
      zone,
      distanceKm: km,
      freeShipping: false,
    };
  }
  return {
    available: true,
    price: FREIGHT_PRICING.min,
    label: zoneLabel(zone, city || ""),
    zone,
    freeShipping: false,
  };
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
      label: `${freight.label} · Frete grátis`,
      message: `Frete grátis em pedidos a partir de R$ ${FREE_FREIGHT_MIN.toFixed(2).replace(".", ",")}`,
    };
  }
  return { ...freight, freeShipping: false };
}

export async function resolveFreightFromCep(
  cep: string,
  orderSubtotal?: number
): Promise<{ address: AddressFromCep | null; freight: FreightResult }> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    return {
      address: null,
      freight: {
        available: false,
        price: 0,
        label: "CEP inválido",
        zone: null,
        message: "Informe um CEP válido com 8 dígitos",
      },
    };
  }

  const address = await fetchAddressByCep(digits);

  let freight = await calcFreightByDistance(
    digits,
    address?.city,
    address?.state,
    address?.neighborhood
  );

  if (typeof orderSubtotal === "number") {
    freight = applyFreeFreight(freight, orderSubtotal);
  }

  return { address, freight };
}

export async function calcFreightSmart(
  cep: string,
  city?: string,
  state?: string,
  orderSubtotal?: number,
  neighborhood?: string,
  _street?: string
): Promise<FreightResult> {
  let result = await calcFreightByDistance(cep, city, state, neighborhood);
  if (typeof orderSubtotal === "number") {
    result = applyFreeFreight(result, orderSubtotal);
  }
  return result;
}

export function formatCep(cep: string) {
  const d = onlyDigits(cep).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
