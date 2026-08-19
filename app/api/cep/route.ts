import { NextRequest, NextResponse } from "next/server";
import { fetchAddressByCep, calcFreightSmart } from "@/lib/cep";

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get("cep") || "";
  const digits = cep.replace(/\D/g, "");

  if (digits.length !== 8) {
    return NextResponse.json({ error: "CEP deve ter 8 dígitos" }, { status: 400 });
  }

  try {
    const address = await fetchAddressByCep(digits);
    if (!address) {
      return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
    }

    const freight = await calcFreightSmart(
      address.cep,
      address.city,
      address.state
    );

    return NextResponse.json({
      address,
      freight,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao consultar CEP" }, { status: 500 });
  }
}
