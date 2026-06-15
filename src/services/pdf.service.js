const puppeteer = require("puppeteer");

const generateLiquidationPDF = async (data) => {
  let browser;
  try {
    const isProd = process.env.NODE_ENV === "production";
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: isProd ? "/usr/bin/google-chrome" : undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // 1. GENERAR EL ID FORMAL (Ej: LIQ-2026-000026)
    const year = new Date().getFullYear();
    const formalID = `${year}-${String(data.id).padStart(6, '0')}`;

    // --- LÓGICA DE AGRUPACIÓN POR OP, CORTE, COLOR, PRENDA Y OPERACIÓN ---
    const groupedMap = new Map();
    data.production_details.forEach((item) => {
      const opNumber = item.production_order?.orderNumber || "S/N";
      const opName = item.operation_catalog?.name || "OPERACIÓN";
      const garmentName = item.production_order?.garment?.name || "PRENDA";
      const cutNumber = item.order_cut?.cutNumber || "";
      const color = item.order_cut?.color || "";
      
      // La llave ahora incluye OP, Corte y Color para separar lotes adecuadamente
      const key = `${opNumber}-${cutNumber}-${color}-${garmentName}-${opName}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          opNumber: opNumber,
          cutNumber: cutNumber,
          color: color,
          opName: opName.toUpperCase(),
          garmentName: garmentName.toUpperCase(),
          totalQty: 0,
          totalSubtotal: 0
        });
      }

      const current = groupedMap.get(key);
      current.totalQty += Number(item.quantityDone || 0);
      // Usamos subtotal directo si existe, sino recalculamos
      current.totalSubtotal += Number(item.subtotal) || (Number(item.quantityDone) * Number(item.unitPriceAtMoment));
    });

    const finalRows = Array.from(groupedMap.values());

    // --- FORMATEO DE FECHAS (Día/Mes/Año) ---
    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    // --- FECHA Y HORA DE IMPRESIÓN ACTUAL ---
    const now = new Date();
    const printDateTime = now.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const operario = `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.toUpperCase();
    const userPhone = data.user?.phone || data.user?.phoneNumber || 'No registrado';
    const periodo = `DEL ${formatDate(data.startDate)} AL ${formatDate(data.endDate)}`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 20px; }
          .brand { font-size: 24px; font-weight: 800; color: #6366f1; }
          .print-info { text-align: right; font-size: 9px; color: #64748b; line-height: 1.4; }
          
          .user-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 25px; }
          .user-name { font-size: 22px; font-weight: 800; margin: 0; color: #0f172a; }
          .user-meta { display: flex; gap: 20px; margin-top: 8px; font-size: 12px; font-weight: 600; color: #475569; }
          .label-blue { color: #6366f1; font-weight: 800; margin-right: 4px; }
          
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; color: #475569; text-align: left; padding: 12px; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
          td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
          
          .op-badge { background: #6366f1; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; margin-right: 4px; }
          .cut-badge { background: #cbd5e1; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; margin-right: 4px; }
          .color-badge { background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; font-style: italic; margin-right: 8px; }
          .garment-tag { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .op-title { font-weight: 700; font-size: 13px; margin-top: 4px; color: #1e293b; }
          .qty-badge { background: #eff6ff; color: #2563eb; padding: 5px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; border: 1px solid #dbeafe; }
          .price-text { font-weight: 800; font-size: 15px; text-align: right; color: #0f172a; }

          .footer-total { margin-top: 30px; background: #1e293b; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
          .total-amount { font-size: 30px; font-weight: 800; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="header-top">
          <div class="brand">DESTAJO PRO</div>
          <div class="print-info">
            <strong>IMPRESIÓN:</strong> ${printDateTime}<br/>
            <strong>LIQ:</strong> ${formalID}
          </div>
        </div>

        <div class="user-card">
          <div style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Operario Responsable</div>
          <h1 class="user-name">${operario}</h1>
          <div class="user-meta">
            <span><span class="label-blue">TELF:</span> ${userPhone}</span>
            <span><span class="label-blue">PERIODO:</span> ${periodo}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Detalle de Producción (OP / Corte / Color / Prenda / Operación)</th>
              <th style="text-align: center;">Cant. Total</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${finalRows.map(row => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center;">
                    <span class="op-badge">OP: ${row.opNumber}</span>
                    ${row.cutNumber ? `<span class="cut-badge">C: ${row.cutNumber}</span>` : ''}
                    ${row.color ? `<span class="color-badge">${row.color}</span>` : ''}
                    <span class="garment-tag">${row.garmentName}</span>
                  </div>
                  <div class="op-title">${row.opName}</div>
                </td>
                <td style="text-align: center;">
                  <span class="qty-badge">${row.totalQty}</span>
                </td>
                <td class="price-text">S/ ${row.totalSubtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-total">
          <div style="text-transform: uppercase; font-size: 12px; letter-spacing: 1px; opacity: 0.8;">Monto Total Liquidado</div>
          <div class="total-amount">S/ ${Number(data.totalAmount).toFixed(2)}</div>
        </div>
      </body>
    </html>`;

    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluateHandle('document.fonts.ready');
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

  } catch (error) {
    console.error("Error PDF:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { generateLiquidationPDF };