# Webhook Asaas — VC Marmitas

## URL do endpoint

```
https://vcmarmitas.netlify.app/api/webhooks/asaas
```

## Configurar no painel Asaas

1. Acesse **Integrações → Webhooks** (ou via API `POST /v3/webhooks`)
2. Crie um webhook com:
   - **URL:** `https://vcmarmitas.netlify.app/api/webhooks/asaas`
   - **E-mail** para alertas de falha
   - **Eventos** (mínimo):
     - `CHECKOUT_PAID`
     - `CHECKOUT_CANCELED`
     - `CHECKOUT_EXPIRED`
     - `PAYMENT_CONFIRMED`
     - `PAYMENT_RECEIVED`
3. (Recomendado) Defina um **token de autenticação** e cadastre no Netlify:

| Variável | Valor |
|----------|--------|
| `ASAAS_WEBHOOK_TOKEN` | o mesmo token do Asaas |

O Asaas envia o token no header `asaas-access-token`.

## O que o webhook faz

| Evento | Status do pedido |
|--------|------------------|
| CHECKOUT_PAID / PAYMENT_CONFIRMED / PAYMENT_RECEIVED | `confirmado` |
| CHECKOUT_CANCELED / CHECKOUT_EXPIRED / PAYMENT_REFUNDED | `cancelado` |

A busca do pedido usa `asaas_checkout_id` (salvo na criação do checkout).

## Testar

1. Faça um pedido de teste (sandbox)
2. Pague no Asaas
3. Veja no `/admin` se o status mudou para **Confirmado**
4. Logs no Netlify → Functions → `api/webhooks/asaas`
