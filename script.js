// ConfiguraciÃƒÂ³n de Supabase
const SUPABASE_URL = 'https://tnqartdfhxbqkkrzlxxu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DGe59IRaOk4tZ5guTPx5Ug_PxXDTytc';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    // 1. Obtener referencias a los inputs
    const inputs = {
        bName: document.getElementById('b-name'),
        bPhone: document.getElementById('b-phone'),
        dsKey: document.getElementById('ds-key'),
        cName: document.getElementById('c-name'),
        cPet: document.getElementById('c-pet'),
        rDate: document.getElementById('r-date'),
        iDesc: document.getElementById('i-desc'),
        iQty: document.getElementById('i-qty'),
        iPrice: document.getElementById('i-price'),
        rMethod: document.getElementById('r-method'),
        rStatus: document.getElementById('r-status'),
        iAdvance: document.getElementById('i-advance'),
        rFolio: document.getElementById('r-folio'),
        rFolioFull: document.getElementById('r-folio-full')
    };

    // 2. Obtener referencias a los elementos de salida (Vista previa)
    const outputs = {
        bName: document.getElementById('out-b-name'),
        bPhone: document.getElementById('out-b-phone'),
        cName: document.getElementById('out-c-name'),
        cPet: document.getElementById('out-c-pet'),
        rDate: document.getElementById('out-date'),
        iDesc: document.getElementById('out-desc'),
        iQty: document.getElementById('out-qty'),
        iSubtotal: document.getElementById('out-subtotal'),
        rMethod: document.getElementById('out-method'),
        rTotal: document.getElementById('out-total'),
        rId: document.getElementById('out-id'),
        
        // Nuevos
        folioGroup: document.getElementById('preview-folio-group'),
        folio: document.getElementById('out-folio'),
        
        advanceSection: document.getElementById('advance-preview-section'),
        fullSection: document.getElementById('full-preview-section'),
        calcTotal: document.getElementById('out-calc-total'),
        advance: document.getElementById('out-advance'),
        remaining: document.getElementById('out-remaining')
    };

    // Generar un ID de recibo aleatorio al cargar
    outputs.rId.textContent = Math.floor(1000 + Math.random() * 9000);

    // Establecer la fecha de hoy por defecto
    const today = new Date().toISOString().split('T')[0];
    inputs.rDate.value = today;

    // Cargar datos guardados
    if (localStorage.getItem('bName')) inputs.bName.value = localStorage.getItem('bName');
    if (localStorage.getItem('bPhone')) inputs.bPhone.value = localStorage.getItem('bPhone');
    if (localStorage.getItem('dsKey')) inputs.dsKey.value = localStorage.getItem('dsKey');

    // FunciÃƒÂ³n principal para actualizar la vista previa
    window.updatePreview = function() {
        const qty = parseFloat(inputs.iQty.value) || 0;
        const price = parseFloat(inputs.iPrice.value) || 0;
        const total = qty * price;
        const isAdvance = inputs.rStatus.value === 'Anticipo';
        
        // Manejar mostrar/ocultar inputs de anticipo
        document.getElementById('advance-row').style.display = isAdvance ? 'flex' : 'none';
        document.getElementById('folio-row-full').style.display = isAdvance ? 'none' : 'flex';

        const currencyConfig = { style: 'currency', currency: 'MXN' };
        
        outputs.bName.textContent = inputs.bName.value || 'Tu Negocio';
        outputs.bPhone.textContent = inputs.bPhone.value ? `Tel: ${inputs.bPhone.value}` : '';
        
        outputs.cName.textContent = inputs.cName.value || '--';
        outputs.cPet.textContent = inputs.cPet.value || '--';
        
        if (inputs.rDate.value) {
            const [y, m, d] = inputs.rDate.value.split('-');
            outputs.rDate.textContent = `${d}/${m}/${y}`;
        } else {
            outputs.rDate.textContent = '--/--/----';
        }

        outputs.iDesc.textContent = inputs.iDesc.value || 'Producto';
        outputs.iQty.textContent = qty;
        outputs.iSubtotal.textContent = total.toLocaleString('es-MX', currencyConfig);
        
        outputs.rMethod.textContent = inputs.rMethod.value;
        
        // Folio
        const folioValue = isAdvance ? inputs.rFolio.value : inputs.rFolioFull.value;
        if (folioValue) {
            outputs.folioGroup.style.display = 'flex';
            outputs.folio.textContent = folioValue;
        } else {
            outputs.folioGroup.style.display = 'none';
        }

        // Secciones de Pago
        if (isAdvance) {
            outputs.fullSection.style.display = 'none';
            outputs.advanceSection.style.display = 'block';
            
            const advanceAmt = parseFloat(inputs.iAdvance.value) || 0;
            const remainingAmt = total - advanceAmt;
            
            outputs.calcTotal.textContent = total.toLocaleString('es-MX', currencyConfig);
            outputs.advance.textContent = "-" + advanceAmt.toLocaleString('es-MX', currencyConfig);
            outputs.remaining.textContent = remainingAmt.toLocaleString('es-MX', currencyConfig);
        } else {
            outputs.advanceSection.style.display = 'none';
            outputs.fullSection.style.display = 'flex';
            outputs.rTotal.textContent = total.toLocaleString('es-MX', currencyConfig);
        }

        localStorage.setItem('bName', inputs.bName.value);
        localStorage.setItem('bPhone', inputs.bPhone.value);
        localStorage.setItem('dsKey', inputs.dsKey.value);
    }

    Object.values(inputs).forEach(input => {
        if (input) input.addEventListener('input', window.updatePreview);
    });

    window.updatePreview();
});

// FunciÃƒÂ³n abstracta para guardar en la nube
async function saveToCloud() {
    const isAdvance = document.getElementById('r-status').value === 'Anticipo';
    const cantidad = parseInt(document.getElementById('i-qty').value) || 1;
    const precio_unitario = parseFloat(document.getElementById('i-price').value) || 0;
    const total = cantidad * precio_unitario;
    const anticipo = isAdvance ? (parseFloat(document.getElementById('i-advance').value) || 0) : 0;
    const saldo_restante = isAdvance ? (total - anticipo) : 0;
    const folioUI = document.getElementById('out-id').textContent; // Folio de 4 dÃƒÂ­gitos generado

    const dataObj = { 
        cliente: document.getElementById('c-name').value || 'Sin Nombre',
        mascota: document.getElementById('c-pet').value || '--',
        concepto: document.getElementById('i-desc').value || 'Plaquita',
        cantidad: cantidad,
        precio_unitario: precio_unitario,
        metodo_pago: document.getElementById('r-method').value,
        estado_pago: document.getElementById('r-status').value,
        anticipo: anticipo,
        saldo_restante: saldo_restante,
        total: total,
        folio_recibo: folioUI,
        entregado: false
    };

    const { error } = await supabaseClient
        .from('recibos')
        .insert([dataObj]);

    if (error) {
        console.error('Error de Supabase:', error);
        throw error;
    }
}

// FunciÃƒÂ³n para imprimir / exportar PDF
async function printReceipt() {
    const btn = document.getElementById('btn-print');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<span class="icon">Ã¢ËœÂÃ¯Â¸Â</span> Guardando...';
        btn.disabled = true;

        await saveToCloud();

    } catch (error) {
        alert("Aviso: No se pudo guardar en la nube, pero se abrirÃƒÂ¡ el PDF para imprimir.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        window.print();
    }
}

// FunciÃƒÂ³n para descargar como imagen PNG
async function downloadImage() {
    const btn = document.getElementById('btn-img');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<span class="icon">Ã¢ËœÂÃ¯Â¸Â</span> Guardando y renderizando...';
        btn.disabled = true;

        // Guardar en la nube primero
        try {
            await saveToCloud();
        } catch (e) {
            console.error("Error al guardar en nube antes de imagen", e);
        }

        // Renderizar el div a Canvas
        const receiptDiv = document.getElementById('receipt-card');
        
        // Esconder bordes curvos "zigzag" temporariamente si causan problemas, pero html2canvas lo maneja decentemente
        const canvas = await html2canvas(receiptDiv, {
            scale: 2, // Mejor resoluciÃƒÂ³n
            backgroundColor: "#ffffff",
            useCORS: true
        });

        // Crear link de descarga
        const link = document.createElement('a');
        link.download = `Recibo_${document.getElementById('c-pet').value || 'Mascota'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

    } catch (error) {
        console.error('Error al generar imagen:', error);
        alert("OcurriÃƒÂ³ un error al generar la imagen.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function clearForm() {
    if(confirm('Ã‚Â¿Deseas limpiar los datos de esta venta?')) {
        document.getElementById('c-name').value = '';
        document.getElementById('c-pet').value = '';
        document.getElementById('i-qty').value = '1';
        document.getElementById('i-price').value = '150';
        document.getElementById('r-folio').value = '';
        document.getElementById('r-folio-full').value = '';
        document.getElementById('r-status').value = 'Completo';
        document.getElementById('c-name').dispatchEvent(new Event('input'));
    }
}

// ==========================================
// ESCÃƒÂNER INTELIGENTE (Tesseract + DeepSeek)
// ==========================================
async function processImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const apiKey = document.getElementById('ds-key').value;
    if (!apiKey) {
        alert("Por favor, ingresa tu API Key de DeepSeek en los ajustes del negocio primero.");
        return;
    }

    const statusDiv = document.getElementById('scanner-status');
    statusDiv.style.display = 'block';
    statusDiv.innerText = "Ã°Å¸â€˜â‚¬ Escaneando comprobante... (1/2)";

    try {
        // 1. Tesseract OCR
        const { data: { text } } = await Tesseract.recognize(file, 'spa');
        
        if (!text || text.trim() === '') throw new Error("No se detectÃƒÂ³ texto");
        
        statusDiv.innerText = "Ã°Å¸Â§Â  Pensando con DeepSeek... (2/2)";

        // 2. DeepSeek API
        const prompt = `Analiza el siguiente texto extraÃƒÂ­do de un comprobante de transferencia bancaria y extrae ÃƒÅ¡NICAMENTE un JSON vÃƒÂ¡lido con esta estructura:
{"nombre_cliente": "El nombre de quien hace el pago/transferencia o titular", "fecha": "fecha en formato YYYY-MM-DD", "folio": "numero de rastreo o folio o autorizacion o clave de rastreo"}. Si no encuentras algo, pon "".
Texto: ${text}`;

        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{"role": "user", "content": prompt}],
                temperature: 0.1
            })
        });

        const result = await response.json();
        
        if (result.error) throw new Error(result.error.message);

        // Limpiar posible formato Markdown del JSON
        let jsonStr = result.choices[0].message.content;
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const extracted = JSON.parse(jsonStr);

        // 3. Autocompletar
        if (extracted.nombre_cliente) document.getElementById('c-name').value = extracted.nombre_cliente;
        if (extracted.fecha) document.getElementById('r-date').value = extracted.fecha;
        
        if (extracted.folio) {
            document.getElementById('r-folio').value = extracted.folio;
            document.getElementById('r-folio-full').value = extracted.folio;
        }

        // Actualizar UI
        window.updatePreview();
        statusDiv.innerText = "Ã¢Å“â€¦ Ã‚Â¡Datos autocompletados!";
        setTimeout(() => statusDiv.style.display = 'none', 3000);

    } catch (e) {
        console.error(e);
        statusDiv.innerText = "Ã¢ÂÅ’ Error al analizar la imagen.";
        setTimeout(() => statusDiv.style.display = 'none', 3000);
    }
    
    // Limpiar input
    event.target.value = '';
}

// ==========================================
// REPORTE DE VENTAS CON INTELIGENCIA ARTIFICIAL
// ==========================================
async function generateReport() {
    const apiKey = document.getElementById('ds-key').value;
    if (!apiKey) {
        alert("Por favor, ingresa tu API Key de DeepSeek en los ajustes del negocio primero.");
        return;
    }

    const modal = document.getElementById('ai-modal');
    const reportBody = document.getElementById('ai-report-body');
    
    // Mostrar modal con estado de carga
    modal.style.display = 'flex';
    reportBody.innerHTML = '<div style="text-align:center; padding:20px;">Cargando datos de la ÃƒÂºltima semana desde Supabase... Ã°Å¸â€â€ž</div>';

    try {
        // 1. Calcular fecha de hace 7 dÃƒÂ­as
        const hoy = new Date();
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hoy.getDate() - 7);
        const fechaFiltro = hace7Dias.toISOString();

        // 2. Traer datos de Supabase
        const { data, error } = await supabaseClient
            .from('recibos')
            .select('*')
            .gte('created_at', fechaFiltro)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            reportBody.innerHTML = '<strong>No hay ventas registradas en los ÃƒÂºltimos 7 dÃƒÂ­as.</strong>';
            return;
        }

        reportBody.innerHTML = '<div style="text-align:center; padding:20px;">Analizando ' + data.length + ' ventas con DeepSeek... Ã°Å¸Â§Â </div>';

        // 3. Preparar los datos para DeepSeek
        // Para no exceder el lÃƒÂ­mite, solo enviaremos datos relevantes
        const datosLimpios = data.map(v => ({
            fecha: v.created_at.split('T')[0],
            producto: v.concepto,
            cantidad: v.cantidad,
            precio: v.precio_unitario,
            estado: v.estado_pago,
            anticipo: v.anticipo,
            saldo_pendiente: v.saldo_restante,
            total: v.total
        }));

        const prompt = `ActÃƒÂºa como un analista financiero experto para mi negocio de placas personalizadas 3D para mascotas.
AquÃƒÂ­ estÃƒÂ¡n mis ventas de los ÃƒÂºltimos 7 dÃƒÂ­as en formato JSON:
${JSON.stringify(datosLimpios)}

Por favor, genera un reporte ejecutivo muy breve que contenga:
1. Un resumen de ingresos totales (incluyendo cuÃƒÂ¡nto dinero estÃƒÂ¡ pendiente de cobro).
2. CuÃƒÂ¡l es el producto mÃƒÂ¡s vendido o tendencia principal.
3. Un consejo estratÃƒÂ©gico accionable para la prÃƒÂ³xima semana.

REGLAS DE FORMATO: Devuelve la respuesta ÃƒÅ¡NICAMENTE en HTML, usando etiquetas como <h3>, <ul>, <li> y <strong>. Usa un estilo amigable. NO uses markdown (ni \`\`\`html ni \`\`\`). Tu respuesta debe poder inyectarse directamente en un div.`;

        // 4. Llamar a DeepSeek
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{"role": "user", "content": prompt}],
                temperature: 0.3
            })
        });

        const result = await response.json();
        
        if (result.error) throw new Error(result.error.message);

        let htmlReport = result.choices[0].message.content;
        
        // Limpiar en caso de que DeepSeek ponga markdown por error
        htmlReport = htmlReport.replace(/```html/gi, '').replace(/```/g, '').trim();

        // 5. Mostrar reporte
        reportBody.innerHTML = htmlReport;

    } catch (error) {
        console.error(error);
        reportBody.innerHTML = `<div style="color:#ef4444;">Ã¢ÂÅ’ Error al generar el reporte: ${error.message}</div>`;
    }
}

// ==========================================
// SPA: NAVEGACIÃ“N Y DASHBOARD
// ==========================================

let historyData = []; // Variable global para guardar el historial descargado

function switchTab(tabId) {
    // Ocultar todas las vistas
    document.getElementById("view-generator").style.display = "none";
    document.getElementById("view-dashboard").style.display = "none";

    // Mostrar la seleccionada
    document.getElementById("view-" + tabId).style.display = "flex";

    // Cambiar estilos de botones manualmente
    const btns = document.querySelectorAll(".nav-btn");
    btns.forEach(b => b.classList.remove("active"));
    
    if (tabId === 'generator') {
        btns[0].classList.add("active");
    } else {
        btns[1].classList.add("active");
        loadHistory();
    }
}

async function loadHistory() {
    const tbody = document.getElementById("history-tbody");
    tbody.innerHTML = "<tr><td colspan=\"8\" style=\"text-align: center;\">Descargando datos desde Supabase... ??</td></tr>";

    try {
        const { data, error } = await supabaseClient
            .from("recibos")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        
        historyData = data || [];
        renderTable(historyData);
    } catch (e) {
        console.error(e);
        tbody.innerHTML = "<tr><td colspan=\"8\" style=\"text-align: center; color: #ef4444;\">Error al cargar datos.</td></tr>";
    }
}

function renderTable(dataArray) {
    const tbody = document.getElementById("history-tbody");
    
    if (dataArray.length === 0) {
        tbody.innerHTML = "<tr><td colspan=\"8\" style=\"text-align: center;\">No se encontraron recibos.</td></tr>";
        return;
    }

    let html = "";
    const currencyConfig = { style: "currency", currency: "MXN" };

    dataArray.forEach(row => {
        const fecha = row.created_at.split("T")[0];
        const tieneDeuda = row.saldo_restante > 0;
model: "deepseek-chat",
                messages: [{"role": "user", "content": prompt}],
                temperature: 0.1
            })
        });

        const result = await response.json();
        
        if (result.error) throw new Error(result.error.message);

        // Limpiar posible formato Markdown del JSON
        let jsonStr = result.choices[0].message.content;
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const extracted = JSON.parse(jsonStr);

        // 3. Autocompletar
        if (extracted.nombre_cliente) document.getElementById('c-name').value = extracted.nombre_cliente;
        if (extracted.fecha) document.getElementById('r-date').value = extracted.fecha;
        
        if (extracted.folio) {
            document.getElementById('r-folio').value = extracted.folio;
            document.getElementById('r-folio-full').value = extracted.folio;
        }

        // Actualizar UI
        window.updatePreview();
        statusDiv.innerText = "Ã¢Å“â€¦ Ã‚Â¡Datos autocompletados!";
        setTimeout(() => statusDiv.style.display = 'none', 3000);

    } catch (e) {
        console.error(e);
        statusDiv.innerText = "Ã¢Â Å’ Error al analizar la imagen.";
        setTimeout(() => statusDiv.style.display = 'none', 3000);
    }
    
    // Limpiar input
    event.target.value = '';
}

// ==========================================
// REPORTE DE VENTAS CON INTELIGENCIA ARTIFICIAL
// ==========================================
async function generateReport() {
    const apiKey = document.getElementById('ds-key').value;
    if (!apiKey) {
        alert("Por favor, ingresa tu API Key de DeepSeek en los ajustes del negocio primero.");
        return;
    }

    const modal = document.getElementById('ai-modal');
    const reportBody = document.getElementById('ai-report-body');
    
    // Mostrar modal con estado de carga
    modal.style.display = 'flex';
    reportBody.innerHTML = '<div style="text-align:center; padding:20px;">Cargando datos de la ÃƒÂºltima semana desde Supabase... Ã°Å¸â€ â€ž</div>';

    try {
        // 1. Calcular fecha de hace 7 dÃƒÂ­as
        const hoy = new Date();
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hoy.getDate() - 7);
        const fechaFiltro = hace7Dias.toISOString();

        // 2. Traer datos de Supabase
        const { data, error } = await supabaseClient
            .from('recibos')
            .select('*')
            .gte('created_at', fechaFiltro)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            reportBody.innerHTML = '<strong>No hay ventas registradas en los ÃƒÂºltimos 7 dÃƒÂ­as.</strong>';
            return;
        }

        reportBody.innerHTML = '<div style="text-align:center; padding:20px;">Analizando ' + data.length + ' ventas con DeepSeek... Ã°Å¸Â§Â </div>';

        // 3. Preparar los datos para DeepSeek
        // Para no exceder el lÃƒÂ­mite, solo enviaremos datos relevantes
        const datosLimpios = data.map(v => ({
            fecha: v.created_at.split('T')[0],
            producto: v.concepto,
            cantidad: v.cantidad,
            precio: v.precio_unitario,
            estado: v.estado_pago,
            anticipo: v.anticipo,
            saldo_pendiente: v.saldo_restante,
            total: v.total
        }));

        const prompt = `ActÃƒÂºa como un analista financiero experto para mi negocio de placas personalizadas 3D para mascotas.
AquÃƒÂ­ estÃƒÂ¡n mis ventas de los ÃƒÂºltimos 7 dÃƒÂ­as en formato JSON:
${JSON.stringify(datosLimpios)}

Por favor, genera un reporte ejecutivo muy breve que contenga:
1. Un resumen de ingresos totales (incluyendo cuÃƒÂ¡nto dinero estÃƒÂ¡ pendiente de cobro).
2. CuÃƒÂ¡l es el producto mÃƒÂ¡s vendido o tendencia principal.
3. Un consejo estratÃƒÂ©gico accionable para la prÃƒÂ³xima semana.

REGLAS DE FORMATO: Devuelve la respuesta ÃƒÅ¡NICAMENTE en HTML, usando etiquetas como <h3>, <ul>, <li> y <strong>. Usa un estilo amigable. NO uses markdown (ni \`\`\`html ni \`\`\`). Tu respuesta debe poder inyectarse directamente en un div.`;

        // 4. Llamar a DeepSeek
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{"role": "user", "content": prompt}],
                temperature: 0.3
            })
        });

        const result = await response.json();
        
        if (result.error) throw new Error(result.error.message);

        let htmlReport = result.choices[0].message.content;
        
        // Limpiar en caso de que DeepSeek ponga markdown por error
        htmlReport = htmlReport.replace(/```html/gi, '').replace(/```/g, '').trim();

        // 5. Mostrar reporte
        reportBody.innerHTML = htmlReport;

    } catch (error) {
        console.error(error);
        reportBody.innerHTML = `<div style="color:#ef4444;">Ã¢Â Å’ Error al generar el reporte: ${error.message}</div>`;
    }
}

// ==========================================
// SPA: NAVEGACIÃ“N Y DASHBOARD
// ==========================================

let historyData = []; // Variable global para guardar el historial descargado

function switchTab(tabId) {
    document.getElementById("view-generator").style.display = "none";
    document.getElementById("view-dashboard").style.display = "none";
    const vs = document.getElementById("view-shipping");
    if (vs) vs.style.display = "none";

    document.getElementById("view-" + tabId).style.display = "flex";

    const btns = document.querySelectorAll(".nav-btn");
    btns.forEach(b => b.classList.remove("active"));
    
    if (tabId === 'generator') {
        btns[0].classList.add("active");
    } else if (tabId === 'dashboard') {
        btns[1].classList.add("active");
        loadHistory();
    } else if (tabId === 'shipping') {
        if(btns.length > 2) btns[2].classList.add("active");
    }
}

async function loadHistory() {
    const tbody = document.getElementById("history-tbody");
    tbody.innerHTML = "<tr><td colspan=\"8\" style=\"text-align: center;\">Descargando datos desde Supabase... ??</td></tr>";

    try {
        const { data, error } = await supabaseClient
            .from("recibos")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        
        historyData = data || [];
        renderTable(historyData);
    } catch (e) {
        console.error(e);
        tbody.innerHTML = "<tr><td colspan=\"8\" style=\"text-align: center; color: #ef4444;\">Error al cargar datos.</td></tr>";
    }
}

function renderTable(dataArray) {
    const tbody = document.getElementById("history-tbody");
    
    if (dataArray.length === 0) {
        tbody.innerHTML = "<tr><td colspan=\"8\" style=\"text-align: center;\">No se encontraron recibos.</td></tr>";
        return;
    }

    let html = "";
    const currencyConfig = { style: "currency", currency: "MXN" };

    dataArray.forEach(row => {
        const fecha = row.created_at.split("T")[0];
        const tieneDeuda = row.saldo_restante > 0;
        
        const badgeEstado = tieneDeuda 
            ? "<span class=\"badge badge-warning\">Debe Saldo</span>"
            : "<span class=\"badge badge-success\">Pagado</span>";
            
        const badgeEntrega = row.entregado
            ? "<span class=\"badge badge-success\">Sí</span>"
            : "<span class=\"badge badge-danger\">No</span>";

        html += `
            <tr>
                <td>${fecha}</td>
                <td><strong>#${row.folio_recibo || "N/A"}</strong></td>
                <td>${row.cliente}</td>
                <td>${row.concepto}</td>
                <td>${badgeEstado}</td>
                <td>${tieneDeuda ? row.saldo_restante.toLocaleString("es-MX", currencyConfig) : "$0.00"}</td>
                <td>${badgeEntrega}</td>
                <td>
                    ${tieneDeuda ? `<button class="action-btn-small btn-liquidar" onclick="liquidarDeuda(${row.id})">Liquidar</button>` : ""}
                    ${!row.entregado ? `<button class="action-btn-small btn-entregar" onclick="marcarEntregado(${row.id})">Entregar</button>` : ""}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function filterHistory() {
    const search = document.getElementById("search-input").value.toLowerCase();
    
    if (!search) {
        renderTable(historyData);
        return;
    }

    const filtered = historyData.filter(row => {
        const folioMatch = (row.folio_recibo || "").toLowerCase().includes(search);
        const nameMatch = (row.cliente || "").toLowerCase().includes(search);
        const dateMatch = (row.created_at || "").includes(search);
        return folioMatch || nameMatch || dateMatch;
    });

    renderTable(filtered);
}

// Acciones del Dashboard
async function liquidarDeuda(id) {
    if(!confirm("Â¿Confirmas que el cliente liquidÃ³ el saldo pendiente?")) return;
    
    try {
        const { error } = await supabaseClient
            .from("recibos")
            .update({ 
                saldo_restante: 0, 
                estado_pago: "Completo" 
            })
            .eq("id", id);

        if (error) throw error;
        loadHistory(); // Recargar tabla
    } catch (e) {
        alert("Error al liquidar: " + e.message);
    }
}

async function marcarEntregado(id) {
    if(!confirm("Â¿Confirmas que ya entregaste la plaquita a este cliente?")) return;
    
    try {
        const { error } = await supabaseClient
            .from("recibos")
            .update({ entregado: true })
            .eq("id", id);

        if (error) throw error;
        loadHistory(); // Recargar tabla
    } catch (e) {
        alert("Error al actualizar: " + e.message);
    }
}


// ==========================================
// MÓDULO DE ETIQUETAS DE ENVÍO
// ==========================================

function copyShippingTemplate() {
    const template = `*¡Hola!* ?? Para poder realizar tu envío, por favor envíanos los siguientes datos en un solo mensaje:

- *Nombre completo:* 
- *Calle y número:* 
- *Colonia/Barrio:* 
- *Ciudad y Estado:* 
- *Código Postal:* 
- *Teléfono:* 
- *Referencias de la casa:* (Ej. casa azul de 2 pisos)`;

    navigator.clipboard.writeText(template).then(() => {
        alert("¡Plantilla copiada al portapapeles! Lista para pegar en WhatsApp.");
    }).catch(err => {
        console.error("Error al copiar: ", err);
        alert("No se pudo copiar automáticamente. Por favor copia manualmente.");
    });
}

function clearShipping() {
    document.getElementById("shipping-input").value = "";
    document.getElementById("sl-name").textContent = "[NOMBRE DEL CLIENTE]";
    document.getElementById("sl-address").textContent = "[Calle y Número]";
    document.getElementById("sl-colony").textContent = "[Colonia]";
    document.getElementById("sl-city").textContent = "[Ciudad y Estado]";
    document.getElementById("sl-zip").textContent = "[00000]";
    document.getElementById("sl-phone").textContent = "[000-000-0000]";
    document.getElementById("sl-refs").textContent = "[Color de casa, entre calles, etc.]";
}

async function generateShippingLabel() {
    const apiKey = document.getElementById("ds-key").value;
    if (!apiKey) {
        alert("Por favor, ingresa tu API Key de DeepSeek en la pestaña de Nuevo Recibo.");
        return;
    }

    const textInput = document.getElementById("shipping-input").value;
    if (!textInput || textInput.trim() === "") {
        alert("Pega primero el mensaje del cliente.");
        return;
    }

    const btn = document.getElementById("btn-ai-label");
    const originalText = btn.innerHTML;
    btn.innerHTML = "<span class=\"icon\">??</span> Analizando con IA...";
    btn.disabled = true;

    try {
        const prompt = `Extrae los datos de envío del siguiente texto y devuélvelos en formato JSON estricto.
Usa las siguientes llaves exactas:
"nombre"
"calle"
"colonia"
"ciudad"
"cp"
"telefono"
"referencias"

Si no encuentras alguna de las partes, pon "No especificado".
Texto del cliente:
"${textInput}"`;

        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{"role": "user", "content": prompt}],
                temperature: 0.1
            })
        });

        const result = await response.json();
        
        if (result.error) throw new Error(result.error.message);

        let jsonStr = result.choices[0].message.content;
        jsonStr = jsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
        const extracted = JSON.parse(jsonStr);

        document.getElementById("sl-name").textContent = extracted.nombre || "No especificado";
        document.getElementById("sl-address").textContent = extracted.calle || "No especificado";
        document.getElementById("sl-colony").textContent = extracted.colonia || "No especificado";
        document.getElementById("sl-city").textContent = extracted.ciudad || "No especificado";
        document.getElementById("sl-zip").textContent = extracted.cp || "00000";
        document.getElementById("sl-phone").textContent = extracted.telefono || "No especificado";
        document.getElementById("sl-refs").textContent = extracted.referencias || "Ninguna";

    } catch (error) {
        console.error(error);
        alert("Error al extraer datos con IA. Asegúrate de que el texto contiene información.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function printShippingLabel() {
    // Hide generator and dashboard, hide navbar, print only the label wrapper
    const style = document.createElement("style");
    style.id = "print-shipping-style";
    style.innerHTML = `
        @media print {
            body * { visibility: hidden; }
            #shipping-label-wrapper, #shipping-label-wrapper * { visibility: visible; }
            #shipping-label-wrapper { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; margin: 0; padding: 0; }
        }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
}

async function downloadShippingLabel() {
    const btn = document.getElementById("btn-img-shipping");
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = "<span class=\"icon\">?</span> Procesando...";
        btn.disabled = true;

        const labelDiv = document.getElementById("shipping-label-wrapper");
        
        const canvas = await html2canvas(labelDiv, {
            scale: 2, 
            backgroundColor: "#ffffff",
            useCORS: true
        });

        const link = document.createElement("a");
        const clientName = document.getElementById("sl-name").textContent.replace(/\\s+/g, "_");
        link.download = `Etiqueta_${clientName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

    } catch (error) {
        console.error("Error al generar imagen:", error);
        alert("Ocurrió un error al generar la imagen.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}



// ==========================================
// SEGURIDAD Y LOGIN
// ==========================================
function checkSession() {
    if(localStorage.getItem('auth_session') === 'rjsoluciones3d') {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('main-app-content').style.display = 'block';
    }
}

function checkPassword() {
    const input = document.getElementById('login-password');
    const err = document.getElementById('login-error');
    
    if(input.value.trim().toLowerCase() === 'rjsoluciones3d') {
        localStorage.setItem('auth_session', 'rjsoluciones3d');
        document.getElementById('login-overlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app-content').style.display = 'block';
            document.getElementById('main-app-content').style.animation = 'fadeIn 0.5s';
        }, 300);
    } else {
        err.style.display = 'block';
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
    }
}

function logout() {
    if(confirm('¿Seguro que deseas salir del sistema?')) {
        localStorage.removeItem('auth_session');
        document.getElementById('login-password').value = '';
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('main-app-content').style.display = 'none';
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('login-overlay').style.opacity = '1';
    }
}




function togglePassword() {
    const input = document.getElementById("login-password");
    const toggle = document.getElementById("toggle-pwd");
    if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "🙈";
    } else {
        input.type = "password";
        toggle.textContent = "👁️";
    }
}
