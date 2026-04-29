const fs = require('fs');
let text = fs.readFileSync('script.js', 'utf8');

// Fix togglePassword completely
text = text.replace(/function togglePassword\(\) \{[\s\S]*?\}/g, '');
text += `
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
`;

// Fix badge encoding but ONLY for the 'Entrega' badge, not the 'Estado' badge!
// We'll replace the exact corrupted strings that might be there.
text = text.replace(/<span class="badge badge-success">SÃ­<\/span>/g, '<span class="badge badge-success">Sí</span>');
text = text.replace(/<span class="badge badge-success">S[^\w]*<\/span>/g, '<span class="badge badge-success">Sí</span>');
text = text.replace(/<span class="badge badge-success">S\??<\/span>/g, '<span class="badge badge-success">Sí</span>');

// Fix switchTab to ensure view-shipping is hidden
const oldSwitch = `function switchTab(tabId) {
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
}`;

const newSwitch = `function switchTab(tabId) {
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
}`;

text = text.replace(oldSwitch, newSwitch);

// Remove any duplicate togglePassword texts
text = text.replace(/toggle.textContent = "dYT\^";/g, 'toggle.textContent = "🙈";');
text = text.replace(/toggle.textContent = "dY\`\?,\?";/g, 'toggle.textContent = "👁️";');

fs.writeFileSync('script.js', text, 'utf8');
