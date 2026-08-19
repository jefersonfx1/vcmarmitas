import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook Asaas
 * URL pública: https://vcmarmitas.netlify.app/api/webhooks/asaas
 *
 * Eventos suportados:
 * - CHECKOUT_PAID / CHECKOUT_CANCELED / CHECKOUT_EXPIRED
 * - PAYMENT_CONFIRMED / PAYMENT_RECEIVED / PAYMENT_REFUNDED / PAYMENT_OVERDUE
 *
 * Auth opcional: header asaas-access-token = ASAAS_WEBHOOK_TOKEN (env)
 */

export async function POST(req: NextRequest) {
  try {
    // Validação opcional do token configurado no Asaas
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (expectedToken) {
      const received =
        req.headers.get("asaas-access-token") ||
        req.headers.get("Asaas-Access-Token") ||
        "";
      if (received !== expectedToken) {
        console.warn("Webhook Asaas: token inválido");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const event = body?.event as string | undefined;

    if (!event) {
      return NextResponse.json({ received: true, skipped: "no event" });
    }

    console.log("Asaas webhook:", event, body?.id);

    const supabase = createAdminClient();

    // --- Eventos de Checkout ---
    if (event.startsWith("CHECKOUT_")) {
      const checkout = body.checkout;
      const checkoutId = checkout?.id as string | undefined;

      if (!checkoutId) {
        return NextResponse.json({ received: true, skipped: "no checkout id" });
      }

      let status: string | null = null;
      if (event === "CHECKOUT_PAID") status = "confirmado";
      else if (event === "CHECKOUT_CANCELED") status = "cancelado";
      else if (event === "CHECKOUT_EXPIRED") status = "cancelado";

      if (status) {
        const { data, error } = await supabase
          .from("orders")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("asaas_checkout_id", checkoutId)
          .select("id, status");

        if (error) {
          console.error("Webhook update error:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          received: true,
          event,
          updated: data?.length || 0,
          status,
        });
      }

      return NextResponse.json({ received: true, event, skipped: "unhandled checkout event" });
    }

    // --- Eventos de Payment ---
    if (event.startsWith("PAYMENT_")) {
      const payment = body.payment;
      const paymentId = payment?.id as string | undefined;
      // Checkout sessions às vezes trazem externalReference ou checkoutSession
      const externalRef =
        payment?.externalReference ||
        payment?.checkoutSession ||
        payment?.checkout?.id;

      let status: string | null = null;
      if (
        event === "PAYMENT_CONFIRMED" ||
        event === "PAYMENT_RECEIVED" ||
        event === "PAYMENT_RECEIVED_IN_CASH"
      ) {
        status = "confirmado";
      } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
        status = "cancelado";
      } else if (event === "PAYMENT_OVERDUE") {
        status = "cancelado";
      }

      if (!status) {
        return NextResponse.json({ received: true, event, skipped: "unhandled payment event" });
      }

      // Tenta por payment id, depois por external reference / checkout id
      let updated = 0;

      if (paymentId) {
        const { data } = await supabase
          .from("orders")
          .update({
            status,
            asaas_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("asaas_payment_id", paymentId)
          .select("id");
        updated += data?.length || 0;
      }

      if (updated === 0 && externalRef) {
        const { data } = await supabase
          .from("orders")
          .update({
            status,
            asaas_payment_id: paymentId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("asaas_checkout_id", externalRef)
          .select("id");
        updated += data?.length || 0;
      }

      // externalReference nosso: order-timestamp — se gravarmos isso no futuro
      if (updated === 0 && payment?.externalReference) {
        const { data } = await supabase
          .from("orders")
          .update({
            status,
            asaas_payment_id: paymentId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("asaas_checkout_id", payment.externalReference)
          .select("id");
        updated += data?.length || 0;
      }

      return NextResponse.json({
        received: true,
        event,
        updated,
        status,
      });
    }

    return NextResponse.json({ received: true, event, skipped: "unknown category" });
  } catch (err) {
    console.error("Webhook Asaas error:", err);
    // Retorna 200 quando possível para evitar fila interrompida em erros transitórios de parse
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "webhook error" },
      { status: 500 }
    );
  }
}

// Asaas pode fazer GET de verificação em alguns fluxos
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "asaas-webhook",
    message: "POST events here",
  });
}
