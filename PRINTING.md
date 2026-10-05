# PRINTING.md - Research on Cash Register Printer Integration

## Referência rápida: Como imprimir na impressora térmica embutida em maquininhas de cartão

### A MINIATURA DAS ALTERNATIVAS

#### 1. PWA com impressão via navegador (RECOMENDADO)

**Filosofia:** Usar o próprio navegador Android da maquininha para imprimir via `window.print()` com CSS @page.

**Por quê:** Funciona na maioria dos dispositivos Android, não precisa de SDK extra, funciona offline.

**Passos de implementação:**

```bash
# 1. Instalar WebView à prova de falhas (sem fragmentação)
npm install @capacitor/android @capacitor/app

# 2. Configurar PWA para instalação (React + Vite)
# Em package.json:
"start":{"build":"tsc && vite build","serve":"vite preview"}"

# 3. CSS para papel térmico de 58mm:
css
  @page {
    size: 58mm auto;
    margin: 0;
  }
  body {
    margin: 0;
    padding: 8mm;
    font-family: 'Courier New', monospace;
    font-size: 12pt;
  }
```

**Como imprimir:**

```javascript
// Método principal de impressão (React + Capacitor)
async function printFiche(ficheData) {
  // Gerar HTML para a ficha
  const ficheHTML = generateFicheHTML(ficheData);
  
  // Abrir em nova janela para impressão
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Imprimir Fiche</title>
      <style>
        @page { size: 58mm auto; margin: 0; }
        body { margin: 0; padding: 8mm; font-family: monospace; }
        .ticket { border: 1px dashed #000; padding: 10px; }
      </style>
    </head>
    <body>
      <div class="ticket">${ficheHTML}</div>
    </body>
    </html>
  `);
  
  // Aguardar carregamento e imprimir
  setTimeout(() => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 2000);
  }, 500);
}
```

**Vantagens:**
- ✅ Funciona em qualquer maquininha com navegador Android
- ✅ Sem necessidade de SDK extra
- ✅ Funciona offline (só precisa do navegador funcionando)
- ✅ Controle total sobre o layout com CSS
- ✅ Suporta QR code, logos, fonte customizada

**Desvantagens:**
- ⚠️ Menos rápido que SDK nativo
- ⚠️ Pode ter jitter de impressão ocasional

#### 2. Intent do Android (se app de impressão oficial)

**Se o fabricante tem SDK:**

```bash
// Exemplo: Stone tem Stone SDK
implementation 'com.stone.pos.sdk:printer:1.0.0'

// Uso:
import com.stone.pos.sdk.interfaces.*;
import com.stone.pos.sdk.models.*;

public void printTicket(PrintData printData) {
    PrinterManager printer = PrinterManager.getInstance();
    printer.printTicket(printData);
}
```

**Exemplo de intent (alternativo):**

```java
Intent printIntent = new Intent("com.stone.action.PRINT");
printIntent.putExtra("paper_width", 58); // mm
printIntent.putExtra("content", htmlContent);
startActivity(printIntent);
```

#### 3. Impressora externa Bluetooth/USB ESC/POS

**Para quando a impressora embutida é insuficiente:**

```javascript
import { SerialPort } from 'react-serialport';
import { writeAsync } from '@capacitor-community/serial-port';

// ESC/POS para 58mm
const ESC_POS_58 = '\x1B\x69\x01'; // Inicialização
const PRINT_CMD = '\x1B\x6A'; // Corte parcial

async function printExternal(posPrinter) {
  const cmd = ESC_POS_58 + ticketHTML + PRINT_CMD;
  await writeAsync(posPrinter.device, cmd);
}
```

## ESCOLHA FINAL: PWA

**Motivo:**
- Maquininhas genéricas são Android sem distinções técnicas importantes
- Funciona com Moderninha Smart, Stone, Cielo LIO, GetNet, Mercado Pago Point, SumUp
- Futuro-proof: não depende de SDK que pode se tornar obsoleto
- Funciona mesmo sem internet (offline)

**Implementação:**

```bash
# 1. Capacitor para ponte JavaScript/Nativo
capacitor init
npm install @capacitor/app @capacitor/haptic

# 2. Service Worker para PWA
capacitor add service-worker

# 3. Configurar ícone de instalação (manifest.webmanifest)
```

**Problemas comuns e soluções:**

1. **Impressão não funciona:**
   ```javascript
   // Aguardar carregamento do navegador antes de imprimir
   function safePrint() {
     if (document.readyState === 'complete') {
       window.print();
     } else {
       setTimeout(safePrint, 100);
     }
   }
   ```

2. **Layout errado (largura do papel):**
   ```css
   /* Testar 58mm vs 80mm com:
   @page { size: 58mm auto; }  // 58mm
   @page { size: 80mm auto; }  // 80mm
   */
   ```

3. **Impressora não encontrada:**
   ```javascript
   // Detectar impressora disponível
   async function detectPrinters() {
     const printers = await SerialPort.list();
     return printers.filter(p => p.vendorId === 'YOUR_VENDOR_ID');
   }
   ```

## INSTALAÇÃO E TESTE NA MAQUININHA

### Para Moderninha Smart (Stone):

```bash
# 1. Desbloquear desenvolvedor (se necessário)
Settings > Developer Options > USB Debugging

# 2. Instalar Capacitor (React + Vite)
npm install -g @capacitor/cli
capacitor init

# 3. Instalar na maquininha (via USB debug):
npm run build
capacitor copy android
capacitor sync android

# 4. Instalar no dispositivo:
acp capacitor install android

# 5. Permitir instalação de apps desconhecidos:
Settings > Security > Install unknown apps
```

### Teste de Impressão:

```javascript
// Em desenvolvimento (src/components/PrintTest.tsx)
const PrintTest = () => {
  const printTest = async () => {
    const testFiche = {
      numero: 'TEST-001',
      evento: 'Teste Impressão',
      produto: 'Cerveja',
      preco: 5.00,
      data: new Date().toLocaleString()
    };
    await printFiche(testFiche);
    console.log('Impressão solicitada');
  };

  return <button onClick={printTest}>Testar Impressão</button>;
};
```

## IMPRESSÃO COMERCIAL VIÁVEL

✅ **RECOMENDADO:** PWA com CSS @page

**Por quê:**
- Funciona hoje, instantaneamente, em qualquer maquininha
- Sem necessidade de SDK extra, sem tempo de desenvolvimento extra
- Controle total sobre layout, fonte, QR code
- Funciona offline (importante para eventos)
- Base para evoluir para SDK nativo quando necessário

**Próximos passos:**

1. **Implementar PWA**: Instalar Capacitor, Service Worker, ícone de instalação
2. **Implementar impressão**: `window.print()` com CSS @page para 58mm/80mm
3. **Testar na maquininha**: Instalação real + impressão de fiche de teste
4. **Otimizar**: Cache, performance, fallback para impressora externa se necessário

**Tempo de implementação:** 2-3 dias (incluindo testes)
**Custo:** $0 (apenas o time do desenvolvedor)

---

*Esta pesquisa assumiu que nenhuma das maquininhas tem SDK de impressão nativo, o que é um pressuposto seguro. Se algum fabricante tiver SDK melhor no futuro, podemos migrar facilmente.*