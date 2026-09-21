/**
 * CEP (ViaCEP) + frete por ZONA FIXA.
 *
 * Removido de propósito: Nominatim, Haversine, km estimado, cache de geocode.
 * Motivo: margem de erro alta e risco de cobrança absurda (ex.: 10 km → R$ 45).
 *
 * O frete por zona abaixo é TEMPORÁRIO até integrar uma API confiável
 * (Google Distance Matrix, Melhor Envio, etc.).
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
};

/** Origem operacional (só referência — não usa geocode) */
export const ORIGIN_CEP = "72631127";

/** Frete grátis a partir deste subtotal */
export const FREE_FREIGHT_MIN = 349.9;

/**
 * Tabela de zonas (valores editáveis).
 * Determinística: mesmo CEP → sempre o mesmo preço.
 */
export const FREIGHT_ZONES = {
  /** Recanto das Emas (bairro da cozinha) */
  local: { price: 10, label: "Recanto das Emas" },
  /** Demais regiões do DF */
  df: { price: 18, label: "Brasília (DF)" },
  /** Valparaíso de Goiás e Novo Gama */
  entorno: { price: 22, label: "Entorno (Valparaíso / Novo Gama)" },
} as const;

function onlyDigits(cep: string) {
  return cep.replace(/\D/g, "");
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const ENTORNO_CITIES = ["valparaiso de goias", "novo gama"];

function isEntorno(city: string): boolean {
  const c = normalize(city);
  return ENTORNO_CITIES.some(
    (a) => c === a || c.includes(a) || a.includes(c)
  );
}

function isRecanto(neighborhood: string, digits: string): boolean {
  const b = normalize(neighborhood);
  if (b.includes("recanto das emas")) return true;
  // Faixa típica de CEP do Recanto (72600–72699)
  const n = parseInt(digits, 10);
  if (n >= 72600000 && n <= 72699999) return true;
  return false;
}

function isDf(city: string, state: string, digits: string): boolean {
  const uf = state.toUpperCase();
  const c = normalize(city);
  const n = parseInt(digits, 10);
  if (uf === "DF") return true;
  if (c.includes("brasilia")) return true;
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

/**
 * Frete por zona (ViaCEP apenas — sem distância).
 */
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

  const cityN = city || "";
  const stateN = state || "";
  const bairroN = neighborhood || "";

  // Fora da área
  if (cityN && !isDf(cityN, stateN, digits) && !isEntorno(cityN)) {
    return {
      available: false,
      price: 0,
      label: "Fora da área de entrega",
      zone: "fora",
      message:
        "Entregamos apenas em Brasília (DF), Valparaíso de Goiás e Novo Gama.",
    };
  }

  if (!cityN) {
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

  if (isRecanto(bairroN, digits)) {
    return {
      available: true,
      price: FREIGHT_ZONES.local.price,
      label: FREIGHT_ZONES.local.label,
      zone: "local",
      freeShipping: false,
    };
  }

  if (isEntorno(cityN)) {
    return {
      available: true,
      price: FREIGHT_ZONES.entorno.price,
      label: cityN || FREIGHT_ZONES.entorno.label,
      zone: "entorno",
      freeShipping: false,
    };
  }

  // Demais DF
  return {
    available: true,
    price: FREIGHT_ZONES.df.price,
    label: FREIGHT_ZONES.df.label,
    zone: "df",
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

/**
 * Nome legado usado pelo checkout/API.
 * Agora = zona fixa (+ frete grátis se aplicável). Sem geocode.
 */
export async function calcFreightSmart(
  cep: string,
  city?: string,
  state?: string,
  orderSubtotal?: number,
  neighborhood?: string,
  _street?: string
): Promise<FreightResult> {
  const result = calcFreight(cep, city, state, neighborhood);
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
