import { NextRequest, NextResponse } from "next/server";

type CartItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
};

type CheckoutBody = {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    cpfCnpj?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();
    const { items, customer } = body;

    if (!items?.length) {
      return NextResponse.json(
        { error: "Carrinho vazio" },
        { status: 400 }
      );
    }

    if (!customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: "Dados do cliente incompletos" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ASAAS_API_KEY não configurada" },
        { status: 500 }
      );
    }

    const env = process.env.ASAAS_ENV || "sandbox";
    const baseUrl =
      env === "production"
        ? "https://api.asaas.com/v3"
        : "https://api-sandbox.asaas.com/v3";

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const asaasItems = items.map((item) => ({
      name: item.name,
      description: item.description || "Marmita congelada",
      quantity: item.quantity,
      value: Number(item.price.toFixed(2)),
      externalReference: item.id,
    }));

    const payload = {
      billingTypes: ["PIX", "CREDIT_CARD"],
      chargeTypes: ["DETACHED"],
      minutesToExpire: 60,
      externalReference: `order-${Date.now()}`,
      callback: {
        successUrl: `${siteUrl}/pedido/sucesso`,
        cancelUrl: `${siteUrl}/pedido/cancelado`,
        expiredUrl: `${siteUrl}/pedido/expirado`,
      },
      items: asaasItems,
      customerData: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone?.replace(/\D/g, "") || undefined,
        cpfCnpj: customer.cpfCnpj?.replace(/\D/g, "") || undefined,
      },
    };

    const response = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
        "User-Agent": "VCMarmitas/1.0",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Asaas error:", data);
      return NextResponse.json(
        {
          error:
            data?.errors?.[0]?.description ||
            data?.message ||
            "Erro ao criar checkout no Asaas",
        },
        { status: response.status }
      );
    }

    // A API retorna id e link (ou montamos o link)
    const checkoutId = data.id;
    const link =
      data.link ||
      (env === "production"
        ? `https://asaas.com/checkoutSession/show?id=${checkoutId}`
        : `https://sandbox.asaas.com/checkoutSession/show?id=${checkoutId}`);

    return NextResponse.json({
      id: checkoutId,
      link,
      status: data.status,
    });
  } catch (err) {
    console.error("Checkout API error:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar checkout" },
      { status: 500 }
    );
  }
}