# VC Marmitas

Site de vendas de marmitas congeladas com área logada, checkout (Asaas), cardápio e painel admin de pedidos.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — autenticação e banco de dados (em breve)
- **Asaas** — pagamentos (PIX, cartão, boleto)
- **Netlify** — hospedagem com autodeploy
- **Zustand** — carrinho de compras

## Funcionalidades atuais

- [x] Página inicial
- [x] Cardápio com filtros (Tradicional, Fitness, Vegetariana)
- [x] Carrinho de compras (persistente)
- [x] Checkout (formulário + esqueleto Asaas)
- [x] Área do cliente (esqueleto)
- [x] **Painel Admin de pedidos** (com edição de status)
- [ ] Integração Asaas (pagamento real)
- [ ] Login / Cadastro (Supabase Auth)
- [ ] Persistência real de pedidos no banco
- [ ] Gerenciamento de produtos no admin

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Páginas principais

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/cardapio` | Cardápio com filtros |
| `/carrinho` | Carrinho de compras |
| `/checkout` | Finalizar pedido |
| `/conta` | Área do cliente |
| `/admin` | Painel de pedidos |
| `/sobre` | Sobre a loja |

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ASAAS_API_KEY=
ASAAS_ENV=sandbox
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Deploy no Netlify

1. Conecte o repositório no Netlify
2. Build command: `npm run build`
3. O plugin `@netlify/plugin-nextjs` já está configurado no `netlify.toml`

## Próximos passos

1. Configurar Supabase (auth + tabelas de pedidos/produtos)
2. Integrar Asaas Checkout / cobranças
3. Proteger a rota `/admin` com autenticação
4. Permitir cadastro/edição de marmitas pelo admin
