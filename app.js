/* ============================================================
   SIDRA · Lógica de la app web
   ============================================================
   Esta es la ÚNICA zona que normalmente vas a editar.
   Está toda comentada para que cualquiera pueda cambiarla.
   ============================================================ */

/* =================== CONFIG (EDITA AQUÍ) =================== */

// ¿Usar datos de demostración (mock)?
//   true  = la app funciona sola, sin conectarse a internet (ideal para presentar).
//   false = la app pide los datos reales a Google Apps Script.
const USE_MOCK_DATA = false;

// URL del Web App de Google Apps Script.
// Pega aquí la URL que te da Google al "Implementar > Nueva implementación".
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxv2aLyasCtbs6e2-JiyLm2Op0N6q9FOIL2HGSg_IlRM8EGrTrm0_YGE0_4rirUCn3a/exec";

// Usuario que se va a consultar (debe existir en tu Google Sheets).
const USUARIO_ACTUAL = "Kirby";

// Enlaces de la marca (cámbialos cuando los tengas definitivos):
const ENLACES = {
  web:       "https://sidra.001webhospedaje.com/#que-es",          // Página web oficial
  instagram: "https://www.instagram.com/sidra.autocultivo/",        // Instagram
  correo:    "contacto@sidra.cl",                                   // Correo de ayuda (placeholder editable)
  manual:    "https://onedrive.live.com/?redeem=aHR0cHM6Ly8xZHJ2Lm1zL2IvYy80ODRkOGI2ZThiYWMzMTg0L0lRQ2pTVTVWYnVGdVM3eGVVZE9HanlQQkFTQzV0OHNVV2FvZEdHb2JjREJDZUgwP2U9bUJnN09t&cid=484D8B6E8BAC3184&id=484D8B6E8BAC3184%21s554e49a3e16e4b6ebc5e51d3868f23c1&parId=484D8B6E8BAC3184%21sff8e267543d84693bd3b02ce15e5818a&o=OneUp"                           // Manual de usuario (placeholder editable)
};

/* =================== DATOS SIMULADOS (MOCK) =================== */
/* Basado en el usuario de ejemplo "Kirby" (rúcula + cebollín).   */
/* Si quieres cambiar el ejemplo de demostración, edítalo aquí.   */
const MOCK_DATA = {
  usuario: { id: "Kirby", estado: "Activo" },
  prototipo: {
    nombre: "SIDRA Balcón",
    ubicacion_gps: "-33.59, -70.70",
    ubicacion_detalle: "Sol Directo",
    litros_balde: 20,
    largo_atrapaniebla_metros: 0,
    total_tubos: 5,
    metros_totales: 25,
    total_plantas: 50,
    estado_sistema: "Funcionando",
    estado_bomba: "Operativa",
    estado_bateria: "Estable",
    estado_panel_solar: "Disponible"
  },
  cultivos: [
    { tipo_planta: "Rúcula",   fecha_siembra: "20/06/2026", cantidad_tubos: 3, largo_tubo_metros: 5, plantas_por_tubo: 10, sustrato_usado: "Solución Nutritiva", estado: "En crecimiento" },
    { tipo_planta: "Cebollín", fecha_siembra: "01/06/2026", cantidad_tubos: 2, largo_tubo_metros: 5, plantas_por_tubo: 10, sustrato_usado: "Solución Nutritiva", estado: "En crecimiento" }
  ],
  clima: {
    fecha_hora_actual: "28/06/2026 22:50",
    temperatura_c: 12.7,
    humedad_ambiente: 28,
    clima_detalle: "nubes",
    mensaje: "La humedad actual es baja, por eso el sistema puede requerir riegos más frecuentes."
  },
  riego: {
    minutos_riego: 6,
    frecuencia_horas: 2,
    dias_espera: 0,
    sustrato_liquido_recomendado: "NPK 15-30-15 para rúcula",
    estimacion_crecimiento: "Cosecha aproximada para cebollín en 30 días",
    justificacion_ia: "Recomendación basada en clima, humedad y policultivo.",
    plan_riego_vigente: "RIEG:6|FREQ:2|WAIT:0",
    mensaje_usuario: "Tu sistema debe regar durante 6 minutos cada 2 horas. Por ahora no necesita pausa adicional."
  },
  // Nivel de agua del estanque (simulado por ahora; cuando exista sensor real, vendrá del backend)
  agua: { nivel: "suficiente" } // valores posibles: "suficiente" | "bajo"
};

/* ============================================================
   A PARTIR DE AQUÍ NO ES NECESARIO EDITAR NADA
   (a menos que quieras cambiar el comportamiento).
   ============================================================ */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  let data;
  let usandoMock = USE_MOCK_DATA;

  if (USE_MOCK_DATA) {
    data = MOCK_DATA;
  } else {
    try {
      const url = APPS_SCRIPT_URL + "?mode=dashboard&usuario=" + encodeURIComponent(USUARIO_ACTUAL);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      data = await resp.json();
      if (data && data.error) throw new Error(data.error);
    } catch (e) {
      // Si algo falla, usamos mock como respaldo y avisamos.
      console.warn("No se pudo conectar con Apps Script:", e);
      data = MOCK_DATA;
      usandoMock = true;
      // mostrarBanner("No se pudo conectar con el sistema. Mostrando datos de demostración.");
    }
  }

  // if (usandoMock && USE_MOCK_DATA) {
  //  mostrarBanner("Modo demostración activo. Cambia USE_MOCK_DATA a false para conectar datos reales.");
  // }

  render(data);
  setupNav();
  setupEnlaces();

  // Ocultar loader, mostrar app
  $("#loader").style.display = "none";
  $("#app").hidden = false;
}

function mostrarBanner(texto) {
  const b = $("#connBanner");
  $("#connBannerText").textContent = texto;
  b.hidden = false;
}

/* =================== RENDER =================== */
function render(d) {
  const p = d.prototipo || {};
  const c = d.clima || {};
  const r = d.riego || {};
  const cultivos = d.cultivos || [];
  const usuario = d.usuario || {};
  const agua = d.agua || { nivel: "suficiente" };

  // --- Estado de marca (barra superior) ---
  $("#brandStatusText").textContent = p.estado_sistema || "Funcionando";

  // --- INICIO ---
  $("#heroTitle").textContent = "Hola " + (usuario.id || USUARIO_ACTUAL) + ", tu sistema está activo";
  $("#featureRiego").textContent = r.mensaje_usuario || "Aún no existe un plan de riego calculado para este usuario.";

  // Métricas rápidas del dashboard
  setMetrics("#metricsGrid", [
    { ic: "🌡️", val: fmtNum(c.temperatura_c) + "°", label: "Temperatura" },
    { ic: "💧", val: fmtNum(c.humedad_ambiente) + "%", label: "Humedad" },
    { ic: "🪣", val: (p.litros_balde ?? "—") + " L", label: "Balde" },
    { ic: "🌱", val: (p.total_plantas ?? "—"), label: "Plantas" }
  ]);

  // Cultivos activos (chips)
  const chips = $("#cultivosChips");
  chips.innerHTML = "";
  cultivos.forEach(cu => {
    const li = document.createElement("li");
    li.textContent = cu.tipo_planta;
    chips.appendChild(li);
  });
  $("#cultivosResumen").textContent =
    cultivos.length + " cultivo(s) en " + (p.total_tubos ?? "—") + " tubos · " + (c.clima_detalle || "—");

  // Próximo riego / cosecha
  $("#proximoRiego").textContent = (r.frecuencia_horas != null)
    ? "Cada " + r.frecuencia_horas + " h · " + (r.minutos_riego ?? "—") + " min"
    : "Sin plan calculado";
  $("#cosechaResumen").textContent = r.estimacion_crecimiento || "";

  // Alerta de agua
  const alerta = $("#aguaAlerta");
  if (agua.nivel === "bajo") {
    alerta.classList.add("is-low");
    $("#aguaTitulo").textContent = "Revisar estanque";
    $("#aguaMensaje").textContent = "El nivel de agua está bajo. Llena el estanque para continuar el riego.";
  } else {
    alerta.classList.remove("is-low");
    $("#aguaTitulo").textContent = "Agua suficiente";
    $("#aguaMensaje").textContent = "El estanque tiene nivel adecuado. SIDRA seguirá regando automáticamente.";
  }

  // --- MIS CULTIVOS ---
  const grid = $("#cultivosGrid");
  grid.innerHTML = "";
  if (!cultivos.length) {
    grid.innerHTML = '<p class="muted">Aún no hay cultivos registrados para este usuario.</p>';
  }
  cultivos.forEach(cu => grid.appendChild(cropCard(cu)));

  // --- RIEGO ---
  $("#riegoMsg").textContent = r.mensaje_usuario || "Aún no existe un plan de riego calculado para este usuario.";
  setMetrics("#riegoMetrics", [
    { ic: "⏱️", val: (r.minutos_riego ?? "—"), label: "Minutos de riego" },
    { ic: "🔁", val: (r.frecuencia_horas ?? "—") + " h", label: "Frecuencia" },
    { ic: "⏸️", val: (r.dias_espera ?? "—"), label: "Días de espera" }
  ]);
  $("#riegoSustrato").textContent = r.sustrato_liquido_recomendado || "—";
  $("#riegoJustificacion").textContent = r.justificacion_ia || "—";
  $("#planTecnico").textContent = r.plan_riego_vigente || "Sin plan disponible";
  $("#endpointEsp32").textContent = "?mode=esp32&usuario=" + (usuario.id || USUARIO_ACTUAL);

  // --- CLIMA ---
  $("#climaTemp").textContent = fmtNum(c.temperatura_c);
  $("#climaDetalle").textContent = c.clima_detalle || "—";
  $("#climaHumedad").textContent = fmtNum(c.humedad_ambiente);
  $("#climaFecha").textContent = c.fecha_hora_actual || "—";
  $("#climaUbic").textContent = p.ubicacion_gps || "—";
  $("#climaUbicDetalle").textContent = p.ubicacion_detalle || "";
  $("#climaMensaje").textContent = c.mensaje || "El clima influye en cada cuánto debe regar el sistema.";

  // --- PROTOTIPO ---
  setMetrics("#protoMetrics", [
    { ic: "🪣", val: (p.litros_balde ?? "—") + " L", label: "Capacidad balde" },
    { ic: "🧱", val: (p.total_tubos ?? "—"), label: "Tubos" },
    { ic: "📏", val: (p.metros_totales ?? "—") + " m", label: "Metros totales" },
    { ic: "🌱", val: (p.total_plantas ?? "—"), label: "Plantas" }
  ]);
  const estados = $("#protoEstados");
  estados.innerHTML = "";
  [
    ["Panel solar", p.estado_panel_solar || "Simulado"],
    ["Batería", p.estado_bateria || "Simulado"],
    ["Bomba", p.estado_bomba || "Simulado"]
  ].forEach(([k, v]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${k}</span><span class="badge">${v}</span>`;
    estados.appendChild(li);
  });
  $("#protoAtrapaniebla").textContent =
    "Largo del atrapanieblas: " + (p.largo_atrapaniebla_metros ?? "—") + " metros.";
}

/* Construye una tarjeta de cultivo */
function cropCard(cu) {
  const el = document.createElement("article");
  el.className = "crop";
  el.innerHTML = `
    <div class="crop__head">
      <span class="crop__name">🌿 ${cu.tipo_planta || "—"}</span>
      <span class="crop__state">${cu.estado || "Activo"}</span>
    </div>
    <div class="crop__grid">
      <div class="crop__cell"><div class="crop__k">Fecha de siembra</div><div class="crop__v">${cu.fecha_siembra || "—"}</div></div>
      <div class="crop__cell"><div class="crop__k">Tubos</div><div class="crop__v">${cu.cantidad_tubos ?? "—"}</div></div>
      <div class="crop__cell"><div class="crop__k">Largo del tubo</div><div class="crop__v">${cu.largo_tubo_metros ?? "—"} m</div></div>
      <div class="crop__cell"><div class="crop__k">Plantas por tubo</div><div class="crop__v">${cu.plantas_por_tubo ?? "—"}</div></div>
      <div class="crop__cell"><div class="crop__k">Sustrato</div><div class="crop__v">${cu.sustrato_usado || "—"}</div></div>
      <div class="crop__cell"><div class="crop__k">Estado</div><div class="crop__v">${cu.estado || "—"}</div></div>
    </div>`;
  return el;
}

/* Genera tarjetas de métrica dentro de un contenedor */
function setMetrics(sel, items) {
  const cont = $(sel);
  cont.innerHTML = "";
  items.forEach(m => {
    const el = document.createElement("div");
    el.className = "metric";
    el.innerHTML = `<div class="metric__ic">${m.ic}</div>
                    <div class="metric__val">${m.val}</div>
                    <div class="metric__label">${m.label}</div>`;
    cont.appendChild(el);
  });
}

function fmtNum(n) {
  return (n === null || n === undefined || n === "") ? "—" : n;
}

/* =================== NAVEGACIÓN =================== */
function setupNav() {
  $$(".nav__item").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      $$(".nav__item").forEach(b => b.classList.toggle("is-active", b === btn));
      $$(".view").forEach(v => { v.hidden = (v.dataset.view !== target); });
      $(".content").scrollTo?.({ top: 0 });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* =================== ENLACES DE MARCA =================== */
function setupEnlaces() {
  const setHref = (id, href) => { const el = $(id); if (el) el.href = href; };
  setHref("#lnkWeb",        ENLACES.web);
  setHref("#lnkWeb2",       ENLACES.web);
  setHref("#lnkInstagram",  ENLACES.instagram);
  setHref("#lnkInstagram2", ENLACES.instagram);
  setHref("#lnkManual",     ENLACES.manual);
  setHref("#lnkCorreo",     "mailto:" + ENLACES.correo + "?subject=Ayuda%20SIDRA");
}
