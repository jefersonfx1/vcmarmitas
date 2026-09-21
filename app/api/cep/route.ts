import { NextRequest, NextResponse } from "next/server";
import { fetchAddressByCep, calcFreightSmart } from "@/lib/cep";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get("cep") || "";
  const orderTotalParam = req.nextUrl.searchParams.get("orderTotal");
  const digits = cep.replace(/\D/g, "");

  if (digits.length !== 8) {
    return NextResponse.json(
      { error: "CEP deve ter 8 dígitos" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const orderSubtotal = orderTotalParam
    ? Number.parseFloat(orderTotalParam)
    : undefined;

  try {
    const address = await fetchAddressByCep(digits);
    if (!address) {
      return NextResponse.json(
        { error: "CEP não encontrado" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const freight = await calcFreightSmart(
      address.cep,
      address.city,
      address.state,
      Number.isFinite(orderSubtotal) ? orderSubtotal : undefined,
      address.neighborhood,
      address.street
    );

    return NextResponse.json(
      {
        address,
        freight: {
          available: freight.available,
          price: freight.price,
          label: freight.label,
          zone: freight.zone,
          distanceKm: freight.distanceKm,
          message: freight.message,
          freeShipping: freight.freeShipping ?? false,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao consultar CEP" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
