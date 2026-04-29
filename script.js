// Configuración de Supabase
const SUPABASE_URL = 'https://tnqartdfhxbqkkrzlxxu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DGe59IRaOk4tZ5guTPx5Ug_PxXDTytc';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
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

    // Función principal para actualizar la vista previa
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

// Función abstracta para guardar en la nube
async function saveToCloud() {
    const isAdvance = document.getElementById('r-status').value === 'Anticipo';
    const cantidad = parseInt(document.getElementById('i-qty').value) || 1;
    const precio_unitario = parseFloat(document.getElementById('i-price').value) || 0;
    const total = cantidad * precio_unitario;
    const anticipo = isAdvance ? (parseFloat(document.getElementById('i-advance').value) || 0) : 0;
    const saldo_restante = isAdvance ? (total - anticipo) : 0;

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
        total: total
    };

    const { error } = await supabaseClient
        .from('recibos')
        .insert([dataObj]);

    if (error) {
        console.error('Error de Supabase:', error);
        throw error;
    }
}

// Función para imprimir / exportar PDF
async function printReceipt() {
    const btn = document.getElementById('btn-print');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<span class="icon">☁️</span> Guardando...';
        btn.disabled = true;

        await saveToCloud();

    } catch (error) {
        alert("Aviso: No se pudo guardar en la nube, pero se abrirá el PDF para imprimir.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        window.print();
    }
}

// Función para descargar como imagen PNG
async function downloadImage() {
    const btn = document.getElementById('btn-img');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<span class="icon">☁️</span> Guardando y renderizando...';
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
            scale: 2, // Mejor resolución
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
        alert("Ocurrió un error al generar la imagen.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function clearForm() {
    if(confirm('¿Deseas limpiar los datos de esta venta?')) {
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
// ESCÁNER INTELIGENTE (Tesseract + DeepSeek)
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
    statusDiv.innerText = "👀 Escaneando comprobante... (1/2)";

    try {
        // 1. Tesseract OCR
        const { data: { text } } = await Tesseract.recognize(file, 'spa');
        
        if (!text || text.trim() === '') throw new Error("No se detectó texto");
        
        statusDiv.innerText = "🧠 Pensando con DeepSeek... (2/2)";

        // 2. DeepSeek API
        const prompt = `Analiza el siguiente texto extraído de un comprobante de transferencia bancaria y extrae ÚNICAMENTE un JSON válido con esta estructura:
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
        statusDiv.innerText = "✅ ¡Datos autocompletados!";
        setTimeout(() => statusDiv.style.display = 'none', 3000);

    } catch (e) {
        console.error(e);
        statusDiv.innerText = "❌ Error al analizar la imagen.";
        setTimeout(() => statusDiv.style.display = 'none', 3000);
    }
    
    // Limpiar input
    event.target.value = '';
}
