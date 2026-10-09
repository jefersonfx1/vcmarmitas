/**
 * Frete por km a partir da cozinha (CEP 72631-127 — Recanto das Emas).
 *
 * Estratégia (determinística, sem depender do centro genérico da BrasilAPI):
 * 1) Valida área de entrega
 * 2) Resolve centroide por bairro / faixa de CEP (tabela local)
 * 3) Haversine origem → destino
 * 4) preço = max(min, base + km × tarifa) — sem teto (cupons compensam depois)
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

/** Cozinha — Recanto das Emas, Quadra 405 */
export const ORIGIN_COORDS = {
  lat: -15.9028,
  lng: -48.0975,
} as const;

export const FREE_FREIGHT_MIN = 349.9;

export const FREIGHT_PRICING = {
  base: 8,
  perKm: 1.4,
  min: 10,
  // sem teto — distância integral; cupons de frete compensam depois
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

function inRange(n: number, min: number, max: number) {
  return n >= min && n <= max;
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
  return Math.round(Math.max(FREIGHT_PRICING.min, raw) * 100) / 100;
}

type Region = {
  name: string;
  lat: number;
  lng: number;
  match: (n: number, city: string, bairro: string, street: string) => boolean;
};

/**
 * Centroides por RA / cidade.
 * Ordem importa: regras mais específicas primeiro.
 */
const REGIONS: Region[] = [
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
      (inRange(n, 72400000, 72449999) || normalize(b) === "gama") &&
      !normalize(b).includes("novo gama"),
  },
  {
    name: "Santa Maria",
    lat: -16.0117,
    lng: -48.0139,
    match: (n, _c, b) =>
      inRange(n, 72500000, 72599999) || normalize(b).includes("santa maria"),
  },
  {
    name: "Núcleo Bandeirante",
    lat: -15.8705,
    lng: -47.9675,
    match: (n, _c, b) =>
      inRange(n, 71705000, 71799999) ||
      normalize(b).includes("nucleo bandeirante") ||
      normalize(b).includes("park way"),
  },
  {
    name: "Guará",
    lat: -15.8255,
    lng: -47.9845,
    match: (n, _c, b) =>
      inRange(n, 71000000, 71099999) || normalize(b).includes("guara"),
  },
  {
    name: "Sudoeste / Octogonal",
    lat: -15.7955,
    lng: -47.9365,
    match: (n, _c, b) =>
      inRange(n, 70600000, 70699999) ||
      normalize(b).includes("sudoeste") ||
      normalize(b).includes("octogonal") ||
      normalize(b).includes("cruzeiro"),
  },
  {
    name: "Asa Sul",
    lat: -15.8125,
    lng: -47.9125,
    match: (n, _c, b, s) =>
      inRange(n, 70200000, 70399999) ||
      normalize(b).includes("asa sul") ||
      /\bsqs\b/i.test(s),
  },
  {
    name: "Asa Norte",
    lat: -15.7555,
    lng: -47.8825,
    match: (n, _c, b, s) =>
      inRange(n, 70700000, 70899999) ||
      inRange(n, 70000000, 70199999) ||
      normalize(b).includes("asa norte") ||
      /\bsqn\b/i.test(s),
  },
  {
    name: "Lago Sul",
    lat: -15.8455,
    lng: -47.8555,
    match: (n, _c, b) =>
      inRange(n, 71600000, 71699999) || normalize(b).includes("lago sul"),
  },
  {
    name: "Lago Norte",
    lat: -15.7355,
    lng: -47.8355,
    match: (n, _c, b) =>
      inRange(n, 71500000, 71599999) || normalize(b).includes("lago norte"),
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
    match: (n, c, b) =>
      inRange(n, 72860000, 72869999) ||
      normalize(c).includes("novo gama") ||
      normalize(b).includes("novo gama"),
  },
  {
    name: "Valparaíso de Goiás",
    lat: -16.0685,
    lng: -47.9765,
    match: (n, c) =>
      inRange(n, 72870000, 72879999) || normalize(c).includes("valparaiso"),
  },
];

function findRegion(
  n: number,
  city: string,
  bairro: string,
  street: string
): Region | null {
  for (const r of REGIONS) {
    if (r.match(n, city, bairro, street)) return r;
  }
  return null;
}

function isAllowedArea(
  n: number,
  city: string,
  state: string,
  bairro: string
): boolean {
  if (state.toUpperCase() === "DF") return true;
  if (normalize(city).includes("brasilia")) return true;
  if (inRange(n, 70000000, 72799999)) return true;
  if (inRange(n, 72860000, 72879999)) return true;
  if (normalize(city).includes("novo gama")) return true;
  if (normalize(city).includes("valparaiso")) return true;
  if (normalize(bairro).includes("recanto das emas")) return true;
  return false;
}

function classifyZone(
  n: number,
  city: string,
  state: string,
  bairro: string
): FreightResult["zone"] {
  if (
    inRange(n, 72600000, 72699999) ||
    normalize(bairro).includes("recanto das emas")
  ) {
    return "local";
  }
  if (
    inRange(n, 72860000, 72879999) ||
    normalize(city).includes("novo gama") ||
    normalize(city).includes("valparaiso")
  ) {
    return "entorno";
  }
  if (
    state.toUpperCase() === "DF" ||
    normalize(city).includes("brasilia") ||
    inRange(n, 70000000, 72799999)
  ) {
    return "df";
  }
  return "fora";
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

/**
 * Cálculo principal por distância.
 */
export function calcFreightByDistanceSync(
  cep: string,
  city = "",
  state = "",
  neighborhood = "",
  street = ""
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

  if (!isAllowedArea(n, city, state, neighborhood)) {
    return {
      available: false,
      price: 0,
      label: "Fora da área de entrega",
      zone: "fora",
      message:
        "Entregamos apenas em Brasília (DF), Valparaíso de Goiás e Novo Gama.",
    };
  }

  const zone = classifyZone(n, city, state, neighborhood);
  const region = findRegion(n, city, neighborhood, street);

  const destLat = region?.lat ?? -15.78;
  const destLng = region?.lng ?? -47.93;
  const regionName = region?.name ?? (city || "Brasília");

  const kmRaw = haversineKm(
    ORIGIN_COORDS.lat,
    ORIGIN_COORDS.lng,
    destLat,
    destLng
  );
  const km = Math.round(kmRaw * 10) / 10;
  const price = priceFromKm(km);

  return {
    available: true,
    price,
    label: `${regionName} · ~${km.toFixed(1).replace(".", ",")} km`,
    zone,
    distanceKm: km,
    freeShipping: false,
  };
}

export async function calcFreightByDistance(
  cep: string,
  city?: string,
  state?: string,
  neighborhood?: string,
  street?: string
): Promise<FreightResult> {
  return calcFreightByDistanceSync(
    cep,
    city,
    state,
    neighborhood,
    street
  );
}

/** Compat */
export function calcFreight(
  cep: string,
  city?: string,
  state?: string,
  neighborhood?: string
): FreightResult {
  return calcFreightByDistanceSync(cep, city, state, neighborhood);
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

  let freight = calcFreightByDistanceSync(
    digits,
    address?.city || "",
    address?.state || "",
    address?.neighborhood || "",
    address?.street || ""
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
  street?: string
): Promise<FreightResult> {
  let result = calcFreightByDistanceSync(
    cep,
    city,
    state,
    neighborhood,
    street
  );
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
