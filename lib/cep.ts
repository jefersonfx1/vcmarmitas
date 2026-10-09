/**
 * CEP + frete por zona (preciso e determinístico).
 *
 * Fonte de verdade do endereço: ViaCEP (com fallback BrasilAPI).
 * Classificação: cidade/UF do provedor + faixas oficiais de CEP.
 *
 * Áreas atendidas:
 * - Recanto das Emas (cozinha) → local
 * - Demais DF → df
 * - Valparaíso de Goiás e Novo Gama → entorno
 * - Qualquer outro → bloqueado
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

export const ORIGIN_CEP = "72631127";

/** Frete grátis a partir deste subtotal (produtos) */
export const FREE_FREIGHT_MIN = 349.9;

export const FREIGHT_ZONES = {
  local: { price: 10, label: "Recanto das Emas" },
  df: { price: 18, label: "Brasília (DF)" },
  entorno: { price: 22, label: "Entorno (Valparaíso / Novo Gama)" },
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

/** Faixas oficiais usadas como reforço quando a cidade não veio */
const CEP_RANGES = {
  /** Recanto das Emas */
  recanto: { min: 72600000, max: 72699999 },
  /** DF (Brasília e RAs) — não inclui 728xx (GO) */
  df: { min: 70000000, max: 72799999 },
  /** Novo Gama — GO */
  novoGama: { min: 72860000, max: 72869999 },
  /** Valparaíso de Goiás — GO */
  valparaiso: { min: 72870000, max: 72879999 },
} as const;

function inRange(n: number, min: number, max: number) {
  return n >= min && n <= max;
}

function isRecantoCityOrBairro(city: string, neighborhood: string): boolean {
  const c = normalize(city);
  const b = normalize(neighborhood);
  return b.includes("recanto das emas") || c.includes("recanto das emas");
}

function isNovoGamaCity(city: string): boolean {
  const c = normalize(city);
  return c === "novo gama" || c.includes("novo gama");
}

function isValparaisoCity(city: string): boolean {
  const c = normalize(city);
  // Valparaíso de Goiás / Valparaiso de Goias
  return c.includes("valparaiso");
}

function isBrasiliaDf(city: string, state: string): boolean {
  const uf = state.toUpperCase();
  const c = normalize(city);
  if (uf === "DF") return true;
  if (c.includes("brasilia")) return true;
  return false;
}

function isEntornoCity(city: string): boolean {
  return isNovoGamaCity(city) || isValparaisoCity(city);
}

export async function fetchAddressByCep(
  cep: string
): Promise<AddressFromCep | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  // 1) ViaCEP
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
    // fallback abaixo
  }

  // 2) BrasilAPI
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
    // ignore
  }

  return null;
}

/**
 * Classifica zona e preço. Preferir sempre city/state/bairro vindos do provedor de CEP.
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

  const n = parseInt(digits, 10);
  const cityN = city || "";
  const stateN = state || "";
  const bairroN = neighborhood || "";

  // —— 1) Recanto das Emas (local) ——
  if (
    isRecantoCityOrBairro(cityN, bairroN) ||
    inRange(n, CEP_RANGES.recanto.min, CEP_RANGES.recanto.max)
  ) {
    // Se ViaCEP disse outra cidade fora do DF, não força local só pelo número
    if (cityN && !isBrasiliaDf(cityN, stateN) && !isRecantoCityOrBairro(cityN, bairroN)) {
      // continua para outras regras
    } else {
      return {
        available: true,
        price: FREIGHT_ZONES.local.price,
        label: FREIGHT_ZONES.local.label,
        zone: "local",
        freeShipping: false,
      };
    }
  }

  // —— 2) Entorno permitido (cidade ou faixa oficial) ——
  if (isNovoGamaCity(cityN) || inRange(n, CEP_RANGES.novoGama.min, CEP_RANGES.novoGama.max)) {
    if (!cityN || isNovoGamaCity(cityN) || stateN.toUpperCase() === "GO") {
      return {
        available: true,
        price: FREIGHT_ZONES.entorno.price,
        label: cityN || "Novo Gama",
        zone: "entorno",
        freeShipping: false,
      };
    }
  }

  if (
    isValparaisoCity(cityN) ||
    inRange(n, CEP_RANGES.valparaiso.min, CEP_RANGES.valparaiso.max)
  ) {
    if (!cityN || isValparaisoCity(cityN) || stateN.toUpperCase() === "GO") {
      return {
        available: true,
        price: FREIGHT_ZONES.entorno.price,
        label: cityN || "Valparaíso de Goiás",
        zone: "entorno",
        freeShipping: false,
      };
    }
  }

  // —— 3) Demais DF ——
  if (
    isBrasiliaDf(cityN, stateN) ||
    (!cityN && inRange(n, CEP_RANGES.df.min, CEP_RANGES.df.max))
  ) {
    // Não classificar 72860–72879 como DF
    if (
      inRange(n, CEP_RANGES.novoGama.min, CEP_RANGES.valparaiso.max) &&
      !isBrasiliaDf(cityN, stateN)
    ) {
      // tratado no entorno acima; se caiu aqui, bloqueia
    } else {
      return {
        available: true,
        price: FREIGHT_ZONES.df.price,
        label: FREIGHT_ZONES.df.label,
        zone: "df",
        freeShipping: false,
      };
    }
  }

  // —— 4) Fora ——
  return {
    available: false,
    price: 0,
    label: "Fora da área de entrega",
    zone: "fora",
    message:
      "Entregamos apenas em Brasília (DF), Valparaíso de Goiás e Novo Gama.",
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
 * Resolve CEP no provedor e calcula frete (uso preferencial no servidor).
 */
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
  if (!address) {
    // Sem endereço: tenta só por faixa de CEP
    const freight = calcFreight(digits);
    if (typeof orderSubtotal === "number") {
      return { address: null, freight: applyFreeFreight(freight, orderSubtotal) };
    }
    return { address: null, freight };
  }

  let freight = calcFreight(
    address.cep,
    address.city,
    address.state,
    address.neighborhood
  );
  if (typeof orderSubtotal === "number") {
    freight = applyFreeFreight(freight, orderSubtotal);
  }
  return { address, freight };
}

/** Compatível com API / checkout antigos */
export async function calcFreightSmart(
  cep: string,
  city?: string,
  state?: string,
  orderSubtotal?: number,
  neighborhood?: string,
  _street?: string
): Promise<FreightResult> {
  // Se já temos cidade/UF confiáveis, calcula direto
  if (city && state) {
    let result = calcFreight(cep, city, state, neighborhood);
    if (typeof orderSubtotal === "number") {
      result = applyFreeFreight(result, orderSubtotal);
    }
    return result;
  }

  // Senão, resolve no provedor (mais preciso)
  const { freight } = await resolveFreightFromCep(cep, orderSubtotal);
  return freight;
}

export function formatCep(cep: string) {
  const d = onlyDigits(cep).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
