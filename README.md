# App para Maquininha de Venda de Fichas de Eventos

## Como rodar o projeto

### Pré-requisitos

- Node.js 20+
- npm 9+
- Git

### Passos

```bash
# 1. Clonar o repositório
git clone <seu-repo>
cd <seu-repo>

# 2. Instalar dependências
npm install

# 3. Executar em desenvolvimento
npm run dev

# 4. Construir para produção
npm run build

# 5. Executar testes
npm test
```

### Deploy

#### Vercel (Recomendado)

```bash
# 1. Criar conta no Vercel
# 2. Instalar Vercel CLI
npm i -g vercel

# 3. Deploy
vercel --prod
```

#### Netlify

```bash
# Instalar CLI do Netlify
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Cloudflare Pages

```bash
# Instalar Wrangler
npm i -g wrangler

# Deploy
wrangler pages deploy dist
```

### Configuração de ambiente

Crie `.env.local` para desenvolvimento:

```env
# Supabase (ou altere se usar outro backend)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# App config
VITE_APP_NAME=Venda de Fichas
VITE_DEFAULT_CURRENCY=BRL
VITE_EVENT_ID=seu-evento-id
```

## Escolha de domínio

Se precisar de domínio personalizado:

### .com.br (Recomendado)

```bash
# 1. Comprar domínio no registro
# 2. Configurar DNS:
A      – @     xx.xx.xx.xx  # IP do Vercel/Netlify
CNAME  – www  –  seu-dominio.com.br

# 3. Para www:
A      – @     xx.xx.xx.xx  # Mesmo IP acima
```

### .com

```bash
# Funciona da mesma forma, só mudar para .com
```

## Estrutura do projeto

```
├── src/
│   ├── components/     # Componentes React
│   ├── hooks/          # Hooks personalizados
│   ├── services/       # Serviços de API
│   ├── stores/         # Zustand/SWR
│   └── utils/          # Utilitários
├── types/              # Tipos TypeScript
├── prints/             # Templates para impressão térmica
├── public/             # Assets, manifest.webmanifest
├── README.md          # Este arquivo
├── PRINTING.md        # Configuração de impressão
├── package.json
└── capacitor.config.ts # Configuração Capacitor
```

## Funcionalidades principais

### PDV (Point of Sale)

- Tela otimizada para maquininha (botões grandes)
- Carrinho em tempo real
- Múltiplas formas de pagamento
- Impressão de fichas com QR code

### Admin

- Gerenciamento de eventos, produtos e operadores
- Configuração de impressão
- Controle de estoque

### Relatórios

- Filtros avançados (data, evento, operador, produto)
- Cards de resumo + tabelas cruzadas
- Exportação CSV/Excel/PDF
- Fechamento de caixa

## Tecnologias utilizadas

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **PWA:** Capacitor, Service Worker, IndexedDB
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Impressão:** PWA com CSS @page para thermal
- **Estabilidade:** UID.uuid() para IDs offline
- **Segurança:** PIN + hash + auditoria de ações

## Primeiros passos

### 1. Executar pela primeira vez

```bash
# Clonar e instalar
npm install

# Iniciar o app (PDV)
npm run dev

# Abrir http://localhost:5173
```

### 2. Login (PDV)

Acessar `/login` e usar:
- **Usuário:** `demo`
- **PIN:** `0000`

### 3. Testar com dados de exemplo

```bash
# Carregar dados de seed (pré-carregado)
# 1 evento, 6 produtos, 30 vendas fictícias
```

### 4. Testar impressão

```bash
# 1. Abrir PDV (botão + para cerveja)
# 2. Adicionar produto
# 3. Finalizar e imprimir
# 4. Confirmar impressão no receptor
```

### 5. Testar offline

```bash
# 1. Desativar internet
# 2. Fazer venda
# 3. Fechar e abrir app novamente
# 4. Sincronizar manualmente
```

## Configuração de impressão (PRINTING.md)

**IMPRESSÃO PWA:** Usando CSS @page em navegador Android da maquininha.

```bash
# Instalar e configurar Capacitor
npm install @capacitor/app @capacitor/haptic
capacitor init

# Instalar Service Worker
capacitor add service-worker
```

### Teste de impressão:

```bash
# No navegador da maquininha:
F12 (devtools) > Command+Shift+P > 'Print'
```

## Checklist de teste (pré-evento)

### Teste 1: Impressão

- [ ] Impressora ligada e conectada
- [ ] Papel térmico de 58mm instalado
- [ ] NFC-e vendido e impresso corretamente
- [ ] QR code legível
- [ ] Número de ficha único

### Teste 2: Offline

- [ ] Desativar internet
- [ ] Vender 3 fichas
- [ ] Fechar e reabrir app
- [ ] Vendas aparecem em "Pendentes"
- [ ] Sincronizar manualmente

### Teste 3: Segurança

- [ ] PIN do caixa (1234) bloqueia acesso
- [ ] Estorno com PIN registrado
- [ ] Reimpressão com PIN supervisor

### Teste 4: Relatório

- [ ] Filtrar por data/evento/funcionário
- [ ] Cards de resumo corretos
- [ ] Exportação CSV funciona
- [ ] Gráfico de vendas por hora

### Teste 5: Performance

- [ ] Venda completa em <3 toques
- [ ] Interface responsiva (maquininha + celular + desktop)
- [ ] Sem erro de impressora após 10 vendas

## Arquivos importantes

- `PRINTING.md` - Instalação de impressora
- `src/components/PDV.vue` - PDV principal
- `src/components/AdminPanel.vue` - Painel admin
- `src/components/SalesReport.vue` - Relatório de vendas
- `src/services/printing.js` - Lógica de impressão
- `src/utils/offlineSync.js` - Sincronização offline

## Troubleshooting

### Erro: Impressora não encontrada

```bash
# No navegador da maquininha:
1. Abrir https://meu-app.vercel.app
2. F12 > Console > Executar:
   navigator.usb.getDevices()
```

### Erro: Layout de impressão errado

```css
/* Ajustar em prints/ticket-styles.css:
.ticket { width: 58mm; }  /* ou 80mm
font-size: 10pt;             /* Ajustar fonte
```

### Erro: Sincronização offline

```bash
# Verificar se IndexedDB tem dados
# Abrir DevTools > Application > IndexedDB
# Verificar se Supabase online
```

## Suporte e Contato

Para bugs, perguntas ou suporte de impressão:
- Abrir issue neste repositório
- Testar impressora antes do evento
- Documentar problemas com impressora específica

---

*Build by Wanderley for Evento Fichas de Venda • 2024*
*Inspired by n8n-skills methodology*