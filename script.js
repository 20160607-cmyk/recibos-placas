// Configuración de Supabase
const SUPABASE_URL = 'https://tnqartdfhxbqkkrzlxxu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DGe59IRaOk4tZ5guTPx5Ug_PxXDTytc';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener referencias a los inputs
    const inputs = {
        bName: document.getElementById('b-name'),
        bPhone: document.getElementById('b-phone'),
        cName: document.getElementById('c-name'),
        cPet: document.getElementById('c-pet'),
        rDate: document.getElementById('r-date'),
        iDesc: document.getElementById('i-desc'),
        iQty: document.getElementById('i-qty'),
        iPrice: document.getElementById('i-price'),
        rMethod: document.getElementById('r-method')
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
        rId: document.getElementById('out-id')
    };

    // Generar un ID de recibo aleatorio al cargar
    outputs.rId.textContent = Math.floor(1000 + Math.random() * 9000);

    // Establecer la fecha de hoy por defecto
    const today = new Date().toISOString().split('T')[0];
    inputs.rDate.value = today;

    // Cargar datos del negocio guardados en LocalStorage
    if (localStorage.getItem('bName')) inputs.bName.value = localStorage.getItem('bName');
    if (localStorage.getItem('bPhone')) inputs.bPhone.value = localStorage.getItem('bPhone');

    // Función principal para actualizar la vista previa
    function updatePreview() {
        // Formatear precios
        const qty = parseFloat(inputs.iQty.value) || 0;
        const price = parseFloat(inputs.iPrice.value) || 0;
        const total = qty * price;
        const currencyConfig = { style: 'currency', currency: 'MXN' }; // Puedes cambiar la moneda
        
        // Actualizar textos
        outputs.bName.textContent = inputs.bName.value || 'Tu Negocio';
        outputs.bPhone.textContent = inputs.bPhone.value ? `Tel: ${inputs.bPhone.value}` : '';
        
        outputs.cName.textContent = inputs.cName.value || '--';
        outputs.cPet.textContent = inputs.cPet.value || '--';
        
        // Formatear fecha a DD/MM/YYYY
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
        outputs.rTotal.textContent = total.toLocaleString('es-MX', currencyConfig);

        // Guardar configuración del negocio automáticamente
        localStorage.setItem('bName', inputs.bName.value);
        localStorage.setItem('bPhone', inputs.bPhone.value);
    }

    // Escuchar cambios en todos los inputs
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Llamada inicial
    updatePreview();
});

// Función para guardar en nube e imprimir
async function printReceipt() {
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerHTML;
    
    try {
        // Indicador visual
        btn.innerHTML = '<span class="icon">☁️</span> Guardando en la nube...';
        btn.disabled = true;

        // Obtener datos del formulario
        const cliente = document.getElementById('c-name').value || 'Sin Nombre';
        const mascota = document.getElementById('c-pet').value || '--';
        const concepto = document.getElementById('i-desc').value || 'Plaquita';
        const cantidad = parseInt(document.getElementById('i-qty').value) || 1;
        const precio_unitario = parseFloat(document.getElementById('i-price').value) || 0;
        const metodo_pago = document.getElementById('r-method').value;
        const total = cantidad * precio_unitario;

        // 1. Guardar en Supabase (La Nube)
        const { data, error } = await supabaseClient
            .from('recibos')
            .insert([
                { 
                    cliente, 
                    mascota, 
                    concepto, 
                    cantidad, 
                    precio_unitario, 
                    metodo_pago, 
                    total 
                }
            ]);

        if (error) {
            console.error('Error de Supabase:', error);
            alert("No se pudo guardar en la nube, revisa la conexión o la configuración de Supabase.");
        }

    } catch (error) {
        console.error('Error general:', error);
    } finally {
        // 2. Restaurar el botón e Imprimir (esto siempre ocurre)
        btn.innerHTML = originalText;
        btn.disabled = false;
        window.print();
    }
}

// Función para limpiar solo los datos del cliente (no los del negocio)
function clearForm() {
    if(confirm('¿Deseas limpiar los datos de esta venta?')) {
        document.getElementById('c-name').value = '';
        document.getElementById('c-pet').value = '';
        document.getElementById('i-qty').value = '1';
        document.getElementById('i-price').value = '150';
        
        // Disparar evento para actualizar
        document.getElementById('c-name').dispatchEvent(new Event('input'));
    }
}
