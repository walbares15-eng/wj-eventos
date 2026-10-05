# Impressão e instalação na Moderninha Smart (PagBank)

Aparelho identificado: **Moderninha Smart** — Android com impressora térmica de **58mm**,
tela sensível ao toque, Wi-Fi/4G e "Loja de apps" (PagStore).

## Como o WJ Eventos funciona nela

- O app é um **PWA** (site instalável): abre no navegador da maquininha e é
  fixado na tela inicial com o ícone **WJ Eventos**.
- A impressão usa o diálogo de impressão do Android (`window.print()` com
  `@page size 58mm`), que envia direto para a **impressora embutida**.
- Cada unidade vendida imprime **1 ficha** com: cabeçalho do evento, nome do
  produto, preço, número sequencial, data/hora, forma de pagamento e **QR Code**.
- O app abre **offline** (Service Worker + dados no navegador) e as vendas
  ficam gravadas no aparelho.

> Importante: a cobrança no cartão continua sendo feita no app **PagVendas**
> da maquininha. No WJ Eventos você só registra a forma de pagamento
> (Dinheiro, PIX, Débito, Crédito, Cortesia) para o relatório.

## Passo a passo de instalação

### 1. Preparar a maquininha
1. Conecte o carregador (na foto a bateria está em 1% — carregue até 100%).
2. Ligue o Wi-Fi: **Configurar → Wi-Fi** e conecte na rede do evento.
3. Confirme que há **bobina de papel 58mm** instalada (teste: **PagVendas →
   qualquer comprovante** para ver se imprime).

### 2. Abrir o WJ Eventos
1. Abra o **navegador** da maquininha (Chrome ou "Internet"/"Navegador").
   - Se não houver navegador visível, abra a **Loja de apps** e procure por
     um navegador, ou instale via APK (veja "Plano B" abaixo).
2. Digite o endereço: `https://wj-eventos-m1x6.vercel.app`
3. Faça login com o PIN do caixa (`0000` = admin).

### 3. Fixar na tela inicial (vira "app")
1. Com o site aberto, toque no menu **⋮** do navegador.
2. Toque em **"Adicionar à tela inicial"** (ou "Instalar aplicativo").
3. Confirme. O ícone **WJ Eventos** aparece ao lado do PagVendas.
4. Abra pelo ícone: o app roda em tela cheia, como aplicativo nativo.

### 4. Configurar antes do evento (no próprio app)
1. Entre com PIN `0000` → **Admin** → aba **🖨️ Impressão**.
2. Confirme: largura **58mm**, cabeçalho com o nome do evento, rodapé.
3. Aba **🍺 Produtos**: confira nomes, preços e fotos.
4. Aba **👤 Operadores**: crie um PIN para cada caixa.

### 5. Teste obrigatório antes do evento
1. Faça uma **venda teste de 1 item** e confira a impressão da ficha.
2. Desligue o Wi-Fi e faça outra venda (**modo offline**).
3. Ligue o Wi-Fi de novo e confira se a venda aparece (sincronização).
4. Teste o botão **🖨️ Reimprimir** no topo do PDV (pede PIN `1234`).

## Plano B — sem navegador na maquininha

Se a sua Moderninha Smart não tiver navegador acessível:

1. **Opção A — Loja de apps:** procure "Chrome" ou "Navegador" na
   **Loja de apps** da maquininha e instale. Depois siga o passo 2 acima.
2. **Opção B — APK do Chrome via USB:** baixe o APK do Chrome no computador,
   copie para um pendrive/USB-OTG, abra o gerenciador de arquivos da
   maquininha, toque no APK e instale. Depois siga o passo 2 acima.
3. **Opção C — impressora externa:** use qualquer celular/tablet com o app
   aberto + impressora térmica Bluetooth 58mm (o diálogo de impressão do
   Android lista impressoras Bluetooth pareadas).

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Diálogo de impressão não aparece | WebView sem serviço de impressão | Use o Chrome (Opção A/B) em vez do navegador embutido |
| Imprime em branco / cortado | Largura errada | Admin → Impressão → **58mm** |
| Ficha sem QR Code | Falha ao gerar QR | Verifique se o item tem nome; o QR usa o número da ficha |
| App não abre offline | Primeira visita sem internet | Abra o app 1x com internet para o Service Worker instalar |
| PIN não entra | Teclado da maquininha | Toque no campo PIN para abrir o teclado numérico |

## Checklist de bolso (dia do evento)

- [ ] Bateria 100% + carregador reserva
- [ ] Bobinas 58mm sobrando (leve o dobro)
- [ ] 1 venda teste impressa OK
- [ ] Teste offline feito
- [ ] PINs dos caixas anotados
- [ ] Celular reserva com o app logado
