/** Utilitários de CEP — Brasília (DF) e entorno */

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
  message?: string;
};

function onlyDigits(cep: string) {
  return cep.replace(/\D/g, "");
}

/** Busca endereço no ViaCEP */
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
 * Zonas de entrega:
 * - Brasília (DF): CEP 70000–72999 e algumas faixas do DF
 * - Entorno (GO): cidades próximas — Águas Lindas, Valparaíso, Novo Gama,
 *   Cidade Ocidental, Luziânia, Formosa, Planaltina de Goiás, Santo Antônio do Descoberto, etc.
 *
 * Ajuste os valores de frete conforme a operação real.
 */
const ENTORNO_CITIES = [
  "aguas lindas de goias",
  "águas lindas de goiás",
  "valparaiso de goias",
  "valparaíso de goiás",
  "novo gama",
  "cidade ocidental",
  "luziania",
  "luziânia",
  "formosa",
  "planaltina",
  "santo antonio do descoberto",
  "santo antônio do descoberto",
  "padre bernardo",
  "alexania",
  "alexânia",
  "crixas do tocantins", // raro, manter se quiser
];

export function calcFreight(cep: string, city?: string, state?: string): FreightResult {
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
  const uf = (state || "").toUpperCase();
  const cityNorm = (city || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // DF — Brasília e regiões administrativas (faixa típica 70xxx–72xxx)
  const isDfByCep = n >= 70000000 && n <= 73699999;
  const isDfByState = uf === "DF";

  if (isDfByCep || isDfByState) {
    return {
      available: true,
      price: 12.0,
      label: "Brasília (DF)",
      zone: "brasilia",
    };
  }

  // Entorno — Goiás, cidades listadas
  const isEntornoCity = ENTORNO_CITIES.some((c) => {
    const cn = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return cityNorm.includes(cn) || cn.includes(cityNorm);
  });

  // Faixas de CEP comuns do entorno de Brasília (GO)
  // 72xxx parcialmente já coberto; GO próximo costuma 72–73 e alguns 74
  const isEntornoCep =
    (n >= 72800000 && n <= 72999999) || // Valparaíso, Novo Gama, etc.
    (n >= 73700000 && n <= 73999999); // Formosa e região

  if ((uf === "GO" || !uf) && (isEntornoCity || isEntornoCep)) {
    return {
      available: true,
      price: 22.0,
      label: "Entorno de Brasília",
      zone: "entorno",
    };
  }

  return {
    available: false,
    price: 0,
    label: "Fora da área de entrega",
    zone: "fora",
    message:
      "No momento entregamos apenas em Brasília (DF) e cidades do entorno. Confira o CEP.",
  };
}

export function formatCep(cep: string) {
  const d = onlyDigits(cep).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
