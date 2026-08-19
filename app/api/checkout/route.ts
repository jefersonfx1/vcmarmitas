import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcFreight } from "@/lib/cep";

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
  couponCode?: string;
  freight?: number;
};

function truncate(str: string, max: number) {
  const s = (str || "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();
    const { items, customer, userId, couponCode } = body;

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

    const freightCheck = calcFreight(
      customer.postalCode,
      customer.city,
      undefined
    );
    if (!freightCheck.available) {
      return NextResponse.json(
        {
          error:
            freightCheck.message ||
            "Não entregamos neste CEP. Atendemos Brasília, Valparaíso e Novo Gama.",
        },
        { status: 400 }
      );
    }

    let freightAmount = freightCheck.price;

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

    const subtotal = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    let discountOrder = 0;
    let discountFreight = 0;
    let appliedCouponCode: string | null = null;
    let couponId: string | null = null;

    if (couponCode) {
      const supabase = createAdminClient();
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", couponCode.trim())
        .maybeSingle();

      if (coupon && coupon.active) {
        const now = new Date();
        const startsOk =
          !coupon.starts_at || new Date(coupon.starts_at) <= now;
        const expiresOk =
          !coupon.expires_at || new Date(coupon.expires_at) >= now;
        const usesOk =
          coupon.max_uses == null || coupon.used_count < coupon.max_uses;
        const minOk = subtotal >= (Number(coupon.min_order_value) || 0);

        let perUserOk = true;
        if (coupon.per_user_limit != null && coupon.per_user_limit > 0) {
          let q = supabase
            .from("coupon_redemptions")
            .select("id", { count: "exact", head: true })
            .eq("coupon_id", coupon.id);
          if (userId) q = q.eq("user_id", userId);
          else q = q.ilike("customer_email", customer.email);
          const { count } = await q;
          perUserOk = (count || 0) < coupon.per_user_limit;
        }

        let firstOk = true;
        if (coupon.first_purchase_only) {
          let oq = supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .neq("status", "cancelado");
          if (userId) oq = oq.eq("user_id", userId);
          else oq = oq.ilike("customer_email", customer.email);
          const { count } = await oq;
          firstOk = (count || 0) === 0;
        }

        if (startsOk && expiresOk && usesOk && minOk && perUserOk && firstOk) {
          const appliesTo = coupon.applies_to || "order";
          const calc = (base: number) => {
            if (base <= 0) return 0;
            let d =
              coupon.discount_type === "percent"
                ? (base * Number(coupon.discount_value)) / 100
                : Number(coupon.discount_value);
            return Math.round(Math.min(d, base) * 100) / 100;
          };

          if (appliesTo === "order" || appliesTo === "both") {
            discountOrder = calc(subtotal);
          }
          if (appliesTo === "freight" || appliesTo === "both") {
            discountFreight = calc(freightAmount);
          }

          appliedCouponCode = coupon.code;
          couponId = coupon.id;
        }
      }
    }

    freightAmount = Math.max(0, freightAmount - discountFreight);
    const itemsTotal = Math.round((subtotal - discountOrder) * 100) / 100;
    const total = Math.round((itemsTotal + freightAmount) * 100) / 100;
    const discountAmount =
      Math.round((discountOrder + discountFreight) * 100) / 100;

    let asaasItems;
    if (discountOrder > 0 && subtotal > 0) {
      const factor = itemsTotal / subtotal;
      asaasItems = items.map((item) => {
        const unit = Number((item.price * factor).toFixed(2));
        return {
          name: truncate(item.name, 30),
          description: truncate(
            item.description || item.name || "Marmita congelada",
            150
          ),
          quantity: item.quantity,
          value: unit > 0 ? unit : 0.01,
          externalReference: String(item.id).slice(0, 100),
        };
      });
    } else {
      asaasItems = items.map((item) => ({
        name: truncate(item.name, 30),
        description: truncate(
          item.description || item.name || "Marmita congelada",
          150
        ),
        quantity: item.quantity,
        value: Number(item.price.toFixed(2)),
        externalReference: String(item.id).slice(0, 100),
      }));
    }

    if (freightAmount > 0) {
      asaasItems.push({
        name: truncate(`Frete ${freightCheck.label}`, 30),
        description: "Taxa de entrega",
        quantity: 1,
        value: Number(freightAmount.toFixed(2)),
        externalReference: "freight",
      });
    }

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
          coupon_code: appliedCouponCode,
          discount_amount: discountAmount,
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

        if (freightAmount > 0) {
          orderItems.push({
            order_id: order.id,
            product_id: null,
            product_name: `Frete — ${freightCheck.label}`,
            product_price: freightAmount,
            quantity: 1,
          });
        }

        await supabase.from("order_items").insert(orderItems);

        if (couponId) {
          const { data: c } = await supabase
            .from("coupons")
            .select("used_count")
            .eq("id", couponId)
            .single();
          if (c) {
            await supabase
              .from("coupons")
              .update({ used_count: (c.used_count || 0) + 1 })
              .eq("id", couponId);
          }

          await supabase.from("coupon_redemptions").insert({
            coupon_id: couponId,
            coupon_code: appliedCouponCode,
            user_id: userId || null,
            customer_email: customer.email,
            order_id: order.id,
          });
        }
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
