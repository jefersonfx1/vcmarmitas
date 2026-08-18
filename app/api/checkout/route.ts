import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    postalCode?: string;
    city?: string;
  };
  userId?: string;
};

/** Asaas limita o nome do item a 30 caracteres */
function truncate(str: string, max: number) {
  const s = (str || "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();
    const { items, customer, userId } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    if (!customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: "Dados do cliente incompletos" },
        { status: 400 }
      );
    }

    if (!customer?.address || !customer?.addressNumber || !customer?.postalCode) {
      return NextResponse.json(
        { error: "Preencha o endereço completo (rua, número e CEP)" },
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

    const total = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const asaasItems = items.map((item) => ({
      name: truncate(item.name, 30),
      description: truncate(
        item.description || item.name || "Marmita congelada",
        150
      ),
      quantity: item.quantity,
      value: Number(item.price.toFixed(2)),
      externalReference: String(item.id).slice(0, 100),
    }));

    const customerData: Record<string, string | number | undefined> = {
      name: truncate(customer.name, 100),
      email: customer.email,
      phone: customer.phone?.replace(/\D/g, "") || undefined,
      cpfCnpj: customer.cpfCnpj?.replace(/\D/g, "") || undefined,
      address: truncate(customer.address, 100),
      addressNumber: String(customer.addressNumber).slice(0, 10),
      complement: customer.complement
        ? truncate(customer.complement, 50)
        : undefined,
      province: customer.province
        ? truncate(customer.province, 50)
        : undefined,
      postalCode: customer.postalCode?.replace(/\D/g, "") || undefined,
    };

    Object.keys(customerData).forEach((key) => {
      if (customerData[key] === undefined || customerData[key] === "") {
        delete customerData[key];
      }
    });

    const externalRef = `order-${Date.now()}`;

    const payload = {
      billingTypes: ["PIX", "CREDIT_CARD"],
      chargeTypes: ["DETACHED"],
      minutesToExpire: 60,
      externalReference: externalRef,
      callback: {
        successUrl: `${siteUrl}/pedido/sucesso`,
        cancelUrl: `${siteUrl}/pedido/cancelado`,
        expiredUrl: `${siteUrl}/pedido/expirado`,
      },
      items: asaasItems,
      customerData,
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

    const checkoutId = data.id;
    const link =
      data.link ||
      (env === "production"
        ? `https://asaas.com/checkoutSession/show?id=${checkoutId}`
        : `https://sandbox.asaas.com/checkoutSession/show?id=${checkoutId}`);

    try {
      const supabase = createAdminClient();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone?.replace(/\D/g, "") || customer.phone,
          customer_cpf: customer.cpfCnpj?.replace(/\D/g, "") || null,
          address_street: customer.address,
          address_number: customer.addressNumber,
          address_complement: customer.complement || null,
          address_neighborhood: customer.province || null,
          address_city: customer.city || null,
          address_cep: customer.postalCode.replace(/\D/g, ""),
          total: Number(total.toFixed(2)),
          status: "pendente",
          asaas_checkout_id: checkoutId,
          user_id: userId || null,
        })
        .select("id")
        .single();

      if (orderError) {
        console.error("Erro ao salvar pedido:", orderError);
      } else if (order) {
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: null,
          product_name: item.name,
          product_price: Number(item.price.toFixed(2)),
          quantity: item.quantity,
        }));

        await supabase.from("order_items").insert(orderItems);
      }
    } catch (dbErr) {
      console.error("Erro Supabase (pedido não salvo):", dbErr);
    }

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
