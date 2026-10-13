/** Helpers de impressao termica e escape HTML para o admin de pedidos */

export type OrderStatus =
  | "pendente"
  | "confirmado"
  | "preparando"
  | "enviado"
  | "entregue"
  | "cancelado";

export type OrderItem = {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_cpf?: string | null;
  total: number;
  status: OrderStatus;
  address_street: string;
  address_number: string;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_cep: string;
  notes?: string | null;
  freight?: number | null;
  subtotal?: number | null;
  created_at: string;
  order_items: OrderItem[];
};

export function formatPrice(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "\u0026amp;";
      case "<":
        return "\u0026lt;";
      case ">":
        return "\u0026gt;";
      case '"':
        return "\u0026quot;";
      case "'":
        return "\u0026#39;";
      default:
        return c;
    }
  });
}

export function playBell() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const ring = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.35, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    };
    ring(880, 0, 0.25);
    ring(1175, 0.12, 0.28);
    ring(880, 0.45, 0.25);
    ring(1175, 0.57, 0.3);
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {
    // ignore
  }
}

export function printThermalReceipt(order: Order) {
  const items = order.order_items || [];
  const itemsHtml = items
    .map(
      (i) =>
        "<tr>" +
        '<td style="padding:2px 0;vertical-align:top">' +
        i.quantity +
        "x</td>" +
        '<td style="padding:2px 4px;vertical-align:top">' +
        escapeHtml(i.product_name) +
        "</td>" +
        '<td style="padding:2px 0;text-align:right;vertical-align:top;white-space:nowrap">' +
        formatPrice(Number(i.product_price) * i.quantity) +
        "</td>" +
        "</tr>"
    )
    .join("");

  const complement = order.address_complement
    ? ", " + escapeHtml(order.address_complement)
    : "";
  const neighborhood = order.address_neighborhood
    ? "<div>Bairro: " + escapeHtml(order.address_neighborhood) + "</div>"
    : "";
  const city = order.address_city
    ? "<div>Cidade: " + escapeHtml(order.address_city) + "</div>"
    : "";
  const notes = order.notes
    ? '<div style="margin-top:8px;border-top:1px dashed #000;padding-top:6px"><strong>OBS:</strong> ' +
      escapeHtml(order.notes) +
      "</div>"
    : "";

  const html =
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\" />" +
    "<title>Pedido " +
    order.id.slice(0, 8) +
    "</title><style>" +
    "@page { size: 80mm auto; margin: 2mm; }" +
    "* { box-sizing: border-box; }" +
    "body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 4px; color: #000; line-height: 1.35; }" +
    "h1 { font-size: 15px; text-align: center; margin: 0 0 4px; }" +
    ".sub { text-align: center; font-size: 11px; margin-bottom: 8px; }" +
    "hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }" +
    "table { width: 100%; border-collapse: collapse; }" +
    ".right { text-align: right; }" +
    ".bold { font-weight: bold; }" +
    ".total { font-size: 14px; font-weight: bold; }" +
    ".footer { text-align: center; margin-top: 10px; font-size: 10px; }" +
    "</style></head><body>" +
    "<h1>VC MARMITAS</h1>" +
    '<div class="sub">Vani Aguiar · Personal Chef</div><hr />' +
    "<div><strong>Pedido:</strong> " +
    escapeHtml(order.id.slice(0, 8).toUpperCase()) +
    "</div>" +
    "<div><strong>Data:</strong> " +
    escapeHtml(formatDate(order.created_at)) +
    "</div><hr />" +
    '<div class="bold">CLIENTE</div>' +
    "<div>" +
    escapeHtml(order.customer_name || "-") +
    "</div>" +
    "<div>Tel: " +
    escapeHtml(order.customer_phone || "-") +
    "</div>" +
    (order.customer_email
      ? "<div>E-mail: " + escapeHtml(order.customer_email) + "</div>"
      : "") +
    (order.customer_cpf
      ? "<div>CPF: " + escapeHtml(order.customer_cpf) + "</div>"
      : "") +
    "<hr />" +
    '<div class="bold">ENTREGA</div>' +
    "<div>" +
    escapeHtml(order.address_street || "") +
    ", " +
    escapeHtml(order.address_number || "") +
    complement +
    "</div>" +
    neighborhood +
    city +
    "<div>CEP: " +
    escapeHtml(order.address_cep || "-") +
    "</div><hr />" +
    '<div class="bold">ITENS</div><table>' +
    itemsHtml +
    "</table><hr />" +
    (order.freight != null
      ? '<div class="right">Frete: ' +
        formatPrice(Number(order.freight)) +
        "</div>"
      : "") +
    '<div class="right total">TOTAL: ' +
    formatPrice(Number(order.total)) +
    "</div>" +
    notes +
    "<hr />" +
    '<div class="footer">Obrigado pela preferencia!<br/>Aquecer e aproveitar</div>' +
    "<script>window.onload=function(){window.print();setTimeout(function(){window.close();},400);};</script>" +
    "</body></html>";

  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) {
    alert("Permita pop-ups para imprimir o pedido.");
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
