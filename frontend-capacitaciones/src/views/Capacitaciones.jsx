import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import { VisorArchivo } from "../components/VisorArchivo";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ESTADOS = {
  pendiente: { label: "Pendiente", cls: "bg-gray-100 text-gray-600" },
  en_progreso: { label: "En Progreso", cls: "bg-yellow-100 text-yellow-700" },
  completado: { label: "Completado", cls: "bg-green-100 text-green-700" },
  reprobado: { label: "Reprobado", cls: "bg-red-100 text-red-600" },
};

function Badge({ estado }) {
  const { label, cls } = ESTADOS[estado] || ESTADOS.pendiente;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wide ${cls}`}>{label}</span>;
}

// ─── Gráfica de pastel SVG ───────────────────────────────────────────────────
const PIE_COLORS = {
  completados: "#16a34a",
  en_progreso: "#d97706",
  reprobados: "#dc2626",
  pendientes: "#d1d5db",
};

function GraficaPastel({ datos, size = 120 }) {
  const { completados = 0, en_progreso = 0, reprobados = 0, pendientes = 0, total = 0 } = datos;
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="rounded-full bg-gray-100 flex items-center justify-center" style={{ width: size, height: size }}>
          <span className="text-xs text-gray-400">Sin datos</span>
        </div>
      </div>
    );
  }

  const segmentos = [
    { key: "completados", val: completados, color: PIE_COLORS.completados },
    { key: "en_progreso", val: en_progreso, color: PIE_COLORS.en_progreso },
    { key: "reprobados", val: reprobados, color: PIE_COLORS.reprobados },
    { key: "pendientes", val: pendientes, color: PIE_COLORS.pendientes },
  ].filter(s => s.val > 0);

  const r = size / 2;
  const cx = r;
  const cy = r;
  const radio = r - 4;

  let acum = 0;
  const arcos = segmentos.map(s => {
    const inicio = acum;
    const fin = acum + (s.val / total) * 2 * Math.PI;
    acum = fin;
    const x1 = cx + radio * Math.cos(inicio - Math.PI / 2);
    const y1 = cy + radio * Math.sin(inicio - Math.PI / 2);
    const x2 = cx + radio * Math.cos(fin - Math.PI / 2);
    const y2 = cy + radio * Math.sin(fin - Math.PI / 2);
    const grande = fin - inicio > Math.PI ? 1 : 0;
    return { ...s, d: `M ${cx} ${cy} L ${x1} ${y1} A ${radio} ${radio} 0 ${grande} 1 ${x2} ${y2} Z` };
  });

  if (segmentos.length === 1) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radio} fill={segmentos[0].color} />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcos.map((a, i) => (
        <path key={i} d={a.d} fill={a.color} stroke="white" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

function LeyendaPastel({ datos }) {
  const items = [
    { key: "completados", label: "Completados", val: datos.completados, color: PIE_COLORS.completados },
    { key: "en_progreso", label: "En progreso", val: datos.en_progreso, color: PIE_COLORS.en_progreso },
    { key: "reprobados", label: "Reprobados", val: datos.reprobados, color: PIE_COLORS.reprobados },
    { key: "pendientes", label: "Pendientes", val: datos.pendientes, color: PIE_COLORS.pendientes },
  ];
  return (
    <div className="space-y-1 text-xs w-full max-w-[150px] mx-auto mt-2">
      {items.map(it => (
        <div key={it.key} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: it.color }} />
            <span className="text-gray-600">{it.label}</span>
          </div>
          <strong>{it.val}</strong>
        </div>
      ))}
    </div>
  );
}

// Detalle pregunta por pregunta de un examen ya calificado (aprobado o no).
// La usan tanto el empleado (al reabrir un módulo ya contestado) como el
// admin (al revisar las respuestas de un operador).
function RetroalimentacionExamen({ resultado, onReintentar, intentosRestantes, onRepasarContenido }) {
  // Con intentosRestantes sin definir (ej. la vista del admin) se ignora el
  // límite de 2 intentos: solo aplica a la propia vista del empleado.
  const sinIntentos = !resultado.aprobado && intentosRestantes !== undefined && intentosRestantes <= 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-5 text-center ${resultado.aprobado ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <p className={`text-3xl font-bold mb-1 ${resultado.aprobado ? "text-green-700" : "text-red-600"}`}>
          {resultado.puntaje}%
        </p>
        <p className={`text-lg font-semibold ${resultado.aprobado ? "text-green-700" : "text-red-600"}`}>
          {resultado.aprobado ? "¡Aprobado!" : "Reprobado"}
        </p>
        <p className="text-sm text-gray-500 mt-1">{resultado.aciertos} de {resultado.total} respuestas correctas</p>
        {!resultado.aprobado && intentosRestantes !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            {sinIntentos ? "Agotaste tus 2 intentos." : `Te queda${intentosRestantes === 1 ? "" : "n"} ${intentosRestantes} intento(s).`}
          </p>
        )}
        {sinIntentos ? (
          onRepasarContenido && (
            <button onClick={onRepasarContenido} className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm text-amber-800 hover:bg-amber-100">
              🔒 Repasar contenido para volver a intentar
            </button>
          )
        ) : (
          onReintentar && (
            <button onClick={onReintentar} className="mt-3 rounded-lg border px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
              Volver a intentar
            </button>
          )
        )}
      </div>
      <div className="space-y-3">
        {resultado.resultados.map((r, i) => (
          <div key={r.pregunta_id} className={`rounded-lg p-4 border ${r.acertada ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <p className="text-sm font-semibold text-gray-800 mb-2">
              {i + 1}. {r.texto}
              <span className={`ml-2 text-xs font-bold ${r.acertada ? "text-green-700" : "text-red-600"}`}>
                {r.acertada ? "✓ Correcto" : "✗ Incorrecto"}
              </span>
            </p>
            <ul className="space-y-1 pl-2">
              {r.opciones.map(op => {
                const sel = op.id === r.opcion_seleccionada;
                const cor = op.es_correcta;
                let cls = "text-gray-600";
                if (cor) cls = "text-green-700 font-semibold";
                if (sel && !cor) cls = "text-red-600 font-semibold line-through";
                return (
                  <li key={op.id} className={`text-xs flex items-center gap-2 ${cls}`}>
                    <span>{sel ? "●" : "○"}</span>
                    {op.texto}
                    {cor && <span className="text-[10px] bg-green-100 rounded px-1">Correcta</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeccionExamen({ moduloId, estadoInicial, onCalificado, onRepasarContenido }) {
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [sinExamen, setSinExamen] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [intentosRestantes, setIntentosRestantes] = useState(undefined);

  // Examen en blanco para responder (o reintentar). No consulta la
  // retroalimentación guardada: se usa explícitamente para un intento nuevo.
  const cargarExamenBlanco = useCallback(async () => {
    setCargando(true); setSinExamen(false); setBloqueado(false); setResultado(null); setRespuestas({});
    try {
      const res = await axios.get(`${API}/api/modulos/${moduloId}/examen`);
      setPreguntas(res.data.preguntas || []);
    } catch (err) {
      if (err.response?.status === 404) setSinExamen(true);
      else if (err.response?.status === 403) setBloqueado(true);
      else Swal.fire({ icon: "error", title: "Error al cargar el examen.", confirmButtonColor: "#802907" });
    } finally { setCargando(false); }
  }, [moduloId]);

  // Se captura el estado con el que se abrió el módulo una sola vez: tras
  // calificar un examen nuevo, el padre refresca el progreso y estadoInicial
  // cambia, pero eso no debe disparar de nuevo esta carga inicial.
  const estadoAlAbrir = useRef(estadoInicial);

  // Al abrir un módulo ya contestado, se muestra directamente lo que el
  // usuario respondió la última vez, en vez de un examen en blanco.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (estadoAlAbrir.current === "completado" || estadoAlAbrir.current === "reprobado") {
        setCargando(true);
        try {
          const res = await axios.get(`${API}/api/modulos/${moduloId}/examen/retroalimentacion`);
          if (!cancelado) { setResultado(res.data); setIntentosRestantes(res.data.intentos_restantes); }
          if (!cancelado) setCargando(false);
          return;
        } catch (err) {
          if (cancelado) return;
          if (err.response?.status !== 404) {
            Swal.fire({ icon: "error", title: "Error al cargar la retroalimentación.", confirmButtonColor: "#802907" });
            setCargando(false);
            return;
          }
          // Sin respuestas guardadas todavía (no debería pasar si el estado
          // ya indica que se contestó): cae al examen en blanco.
        }
      }
      if (!cancelado) await cargarExamenBlanco();
    })();
    return () => { cancelado = true; };
  }, [moduloId, cargarExamenBlanco]);

  const enviar = async () => {
    const faltantes = preguntas.filter(p => !respuestas[p.id]);
    if (faltantes.length) {
      Swal.fire({ icon: "warning", title: `Faltan ${faltantes.length} pregunta(s) por responder.`, confirmButtonColor: "#802907" });
      return;
    }
    setEnviando(true);
    try {
      const res = await axios.post(`${API}/api/modulos/${moduloId}/examen`, { respuestas });
      setResultado(res.data);
      setIntentosRestantes(res.data.intentos_restantes);
      onCalificado?.();
    } catch (err) {
      if (err.response?.status === 403) {
        setBloqueado(true);
        Swal.fire({ icon: "warning", title: err.response.data?.message || "Agotaste tus intentos.", confirmButtonColor: "#802907" });
      } else {
        Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al enviar.", confirmButtonColor: "#802907" });
      }
    } finally { setEnviando(false); }
  };

  if (cargando) return <p className="text-center text-sm text-gray-400 py-6">Cargando examen...</p>;
  if (sinExamen) return <p className="text-center text-sm text-gray-400 py-6">Este módulo aún no tiene examen configurado.</p>;

  if (bloqueado) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm font-semibold text-amber-800">🔒 Agotaste tus 2 intentos.</p>
        <p className="text-xs text-amber-700 mt-1">Repasa el contenido (PDF o video) para desbloquear el examen de nuevo.</p>
        {onRepasarContenido && (
          <button onClick={onRepasarContenido} className="mt-3 rounded-lg border border-amber-300 px-4 py-1.5 text-sm text-amber-800 hover:bg-amber-100">
            Ir al contenido
          </button>
        )}
      </div>
    );
  }

  if (resultado) {
    return (
      <RetroalimentacionExamen
        resultado={resultado}
        intentosRestantes={intentosRestantes}
        onReintentar={cargarExamenBlanco}
        onRepasarContenido={onRepasarContenido}
      />
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 font-medium">{preguntas.length} pregunta(s) — necesitas 70% para aprobar (máx. 2 intentos)</p>
      {preguntas.map((p, i) => (
        <div key={p.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">{i + 1}. {p.texto}</p>
          <div className="space-y-2">
            {p.opciones.map(op => (
              <label key={op.id} className={`flex items-center gap-3 rounded-lg border cursor-pointer px-3 py-2 text-sm transition-colors ${respuestas[p.id] === op.id ? "border-[#802907] bg-[#802907]/5 text-[#802907] font-medium" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}>
                <input type="radio" name={`p_${p.id}`} value={op.id} checked={respuestas[p.id] === op.id}
                  onChange={() => setRespuestas(r => ({ ...r, [p.id]: op.id }))} className="accent-[#802907]" />
                {op.texto}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={enviar} disabled={enviando}
        className="w-full rounded-lg bg-[#802907] py-3 font-semibold text-white hover:bg-[#5a1b04] disabled:opacity-60">
        {enviando ? "Enviando..." : "Enviar Examen"}
      </button>
    </div>
  );
}

function IconoEstadoModulo({ estado, desbloqueado }) {
  if (!desbloqueado) return <span className="text-gray-300">🔒</span>;
  if (estado === "completado") return <span className="text-green-600">✓</span>;
  if (estado === "reprobado") return <span className="text-red-500">✗</span>;
  if (estado === "en_progreso") return <span className="text-yellow-600">●</span>;
  return <span className="text-gray-300">○</span>;
}

// VISTA ESTILO CISCO
function VisorCurso({ secciones, moduloInicialId, onCerrar, onProgresoActualizado }) {
  useLockBodyScroll();
  const [activoId, setActivoId] = useState(moduloInicialId);
  const [tab, setTab] = useState("contenido");
  // El examen se desbloquea solo tras revisar el contenido (scroll al final
  // del PDF o video terminado). Si el módulo ya fue aprobado antes, no se
  // vuelve a exigir para permitir repasar el examen libremente.
  const [contenidoListo, setContenidoListo] = useState(false);

  const activo = useMemo(() => {
    for (const s of secciones) {
      const found = s.modulos.find(m => m.modulo.id === activoId);
      if (found) return found;
    }
    return null;
  }, [secciones, activoId]);

  useEffect(() => {
    setContenidoListo(activo?.estado === "completado");
  }, [activoId, activo?.estado]);

  // Solo la sección que contiene el módulo activo se muestra en el esquema del curso
  const seccionActiva = useMemo(() => (
    secciones.find(s => s.modulos.some(m => m.modulo.id === activoId))
  ), [secciones, activoId]);

  useEffect(() => {
    if (activo && activo.estado === "pendiente") {
      axios.post(`${API}/api/modulos/${activo.modulo.id}/iniciar`).catch(() => { });
    }
  }, [activo?.modulo.id]);

  if (!activo) return null;

  const { modulo, tiene_examen } = activo;

  const seleccionar = item => {
    if (!item.desbloqueado) return;
    setActivoId(item.modulo.id);
    setTab("contenido");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b px-6 py-3 shrink-0 bg-gray-50 shadow-sm">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{modulo.nombre}</h3>
          <p className="text-xs text-gray-500 line-clamp-1">{modulo.descripcion}</p>
        </div>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold ml-4 shrink-0">✕</button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Esquema de curso: solo la sección que se está cursando actualmente */}
        <aside className="w-72 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto hidden md:block">
          {seccionActiva && (() => {
            const { seccion, modulos } = seccionActiva;
            const completados = modulos.filter(m => m.estado === "completado").length;
            const pct = modulos.length ? Math.round((completados / modulos.length) * 100) : 0;
            return (
              <div className="border-b border-gray-200">
                <div className="w-full flex items-center justify-between gap-2 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-800">{seccion.nombre}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{completados}/{modulos.length}</span>
                </div>
                <div className="px-4 pb-3 -mt-1">
                  <div className="rounded-full bg-gray-200 h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[#802907] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {modulos.map(item => {
                  const esActivo = item.modulo.id === activoId;
                  const bloqueado = !item.desbloqueado;
                  return (
                    <button key={item.modulo.id}
                      onClick={() => seleccionar(item)}
                      disabled={bloqueado}
                      title={bloqueado ? "Aprueba el examen del módulo anterior (mínimo 70%) para desbloquearlo" : undefined}
                      className={`w-full flex items-center gap-2 pl-6 pr-4 py-2.5 text-left text-xs border-l-4 transition-colors ${esActivo ? "border-[#802907] bg-white font-semibold text-[#802907]"
                          : bloqueado ? "border-transparent text-gray-400 cursor-not-allowed"
                            : "border-transparent text-gray-600 hover:bg-gray-100"
                        }`}>
                      <IconoEstadoModulo estado={item.estado} desbloqueado={item.desbloqueado} />
                      <span className="truncate flex-1">{item.modulo.nombre}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </aside>

        {/* Contenido del módulo activo */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex border-b shrink-0 px-6 pt-2 bg-gray-50">
            <button onClick={() => setTab("contenido")}
              className={`px-5 py-2 text-sm font-semibold transition-colors rounded-t-lg ${tab === "contenido" ? "border-b-2 border-[#802907] text-[#802907] bg-white" : "text-gray-500 hover:text-gray-700"}`}>
              📄 Contenido
            </button>
            {tiene_examen && (
              <button onClick={() => contenidoListo && setTab("examen")}
                disabled={!contenidoListo}
                title={!contenidoListo ? "Revisa todo el contenido (PDF hasta el final o video completo) para desbloquear el examen" : undefined}
                className={`px-5 py-2 text-sm font-semibold transition-colors rounded-t-lg ${tab === "examen" ? "border-b-2 border-[#802907] text-[#802907] bg-white"
                    : !contenidoListo ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-700"
                  }`}>
                {contenidoListo ? "📝 Examen" : "🔒 Examen"}
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {tab === "contenido" ? (
              <div className="h-full flex flex-col gap-4">
                <VisorArchivo fileUrl={modulo.file_url} fileType={modulo.file_type} presentacionJson={modulo.presentacion_json}
                  onCompletado={() => {
                    setContenidoListo(true);
                    axios.post(`${API}/api/modulos/${modulo.id}/contenido-visto`).catch(() => { });
                  }} />
                {tiene_examen && (
                  <div className={`rounded-lg border p-4 shrink-0 ${contenidoListo ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
                    {contenidoListo ? (
                      <>
                        <p className="text-sm text-blue-800 font-medium">¿Ya revisaste el contenido?</p>
                        <p className="text-xs text-blue-600 mt-1">Ve a la pestaña <strong>Examen</strong> cuando estés listo.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-amber-800 font-medium">🔒 El examen está bloqueado</p>
                        <p className="text-xs text-amber-700 mt-1">
                          {modulo.file_type === "video"
                            ? "Deja que el video termine para desbloquearlo."
                            : "Desplázate hasta el final del contenido para desbloquearlo."}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <SeccionExamen
                  moduloId={modulo.id}
                  estadoInicial={activo.estado}
                  onCalificado={onProgresoActualizado}
                  onRepasarContenido={() => { setContenidoListo(false); setTab("contenido"); }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vista Admin ─────────────────────────────────────────────────────────────

// Tarjeta de módulo para el visor de progreso del admin: en vez de "Iniciar" /
// "Continuar" muestra "Ver respuestas" cuando el operador ya contestó el examen.
function TarjetaModuloOperador({ item, onVer }) {
  const { modulo, estado, puntaje, intentos, tiene_examen } = item;
  const desbloqueado = item.desbloqueado !== false;
  const imgSrc = modulo.imagen_url || null;
  const puedeVer = tiene_examen && (estado === "completado" || estado === "reprobado");

  return (
    <div
      onClick={() => puedeVer && onVer(item)}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col group transition-shadow ${puedeVer ? "cursor-pointer hover:shadow-md" : ""}`}
    >
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt={modulo.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
            {modulo.file_type === "pdf" ? "📄" : modulo.file_type === "presentacion" ? "🖼️" : modulo.file_type === "video" ? "🎬" : "📦"}
          </div>
        )}
        {!desbloqueado && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-3xl">🔒</div>
        )}
        <span className="absolute top-2 right-2"><Badge estado={estado} /></span>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{modulo.nombre}</h4>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{modulo.descripcion}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[10px]">
          {tiene_examen && <span className="font-bold rounded-full px-2 py-0.5 bg-purple-100 text-purple-700">📝 Examen</span>}
          {intentos > 0 && <span className="text-gray-400">🔁 {intentos} intento(s)</span>}
          {puntaje !== null && (
            <span className={`font-bold ${puntaje >= 70 ? "text-green-600" : "text-red-500"}`}>{puntaje}%</span>
          )}
        </div>

        <button
          onClick={e => { e.stopPropagation(); if (puedeVer) onVer(item); }}
          disabled={!puedeVer}
          className={`mt-auto rounded-lg px-3 py-1.5 text-xs font-semibold ${puedeVer ? "bg-[#802907] text-white hover:bg-[#5a1b04]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
          {puedeVer ? "Ver respuestas" : tiene_examen ? "Aún sin contestar" : "Sin examen"}
        </button>
      </div>
    </div>
  );
}

// Visor de progreso de un operador para el admin: navega por tarjetas de
// secciones y módulos igual que la vista del empleado (con su barra de
// avance), y al entrar a un módulo ya contestado muestra la retroalimentación
// pregunta por pregunta en vez de dejarlo rendir el examen.
function VisorProgresoOperador({ usuarioId, usuarioNombre, moduloInicialId, onCerrar }) {
  useLockBodyScroll();
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seccionActivaId, setSeccionActivaId] = useState(null);
  const [moduloActivo, setModuloActivo] = useState(null);
  const [retro, setRetro] = useState(null);
  const [cargandoRetro, setCargandoRetro] = useState(false);

  const abrirRetro = useCallback((item) => {
    if (!item.progreso_id) return;
    setModuloActivo(item);
    setRetro(null);
    setCargandoRetro(true);
    axios.get(`${API}/api/progreso/${item.progreso_id}/retroalimentacion`)
      .then(res => setRetro(res.data))
      .catch(() => Swal.fire({ icon: "error", title: "Error al cargar las respuestas.", confirmButtonColor: "#802907" }))
      .finally(() => setCargandoRetro(false));
  }, []);

  useEffect(() => {
    let cancelado = false;
    axios.get(`${API}/api/progreso/usuario/${usuarioId}`)
      .then(res => {
        if (cancelado) return;
        setSecciones(res.data);
        if (moduloInicialId) {
          const sec = res.data.find(s => s.modulos.some(m => m.modulo.id === moduloInicialId));
          const item = sec?.modulos.find(m => m.modulo.id === moduloInicialId);
          if (sec) setSeccionActivaId(sec.seccion.id);
          if (item) abrirRetro(item);
        }
      })
      .catch(() => Swal.fire({ icon: "error", title: "Error al cargar el progreso.", confirmButtonColor: "#802907" }))
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);

  const seccionActiva = secciones.find(s => s.seccion.id === seccionActivaId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b px-6 py-3 shrink-0 bg-gray-50 shadow-sm">
        <div className="min-w-0 flex items-center gap-2 flex-wrap text-sm">
          <span className="font-bold text-gray-800">Capacitaciones de {usuarioNombre}</span>
          {seccionActiva && (
            <>
              <span className="text-gray-400">/</span>
              <button onClick={() => { setSeccionActivaId(null); setModuloActivo(null); setRetro(null); }}
                className="text-gray-600 hover:text-[#802907] hover:underline">
                {seccionActiva.seccion.nombre}
              </button>
            </>
          )}
          {moduloActivo && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-800 font-semibold">{moduloActivo.modulo.nombre}</span>
            </>
          )}
        </div>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold ml-4 shrink-0">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {cargando ? (
          <p className="text-center text-sm text-gray-400 py-12">Cargando progreso...</p>
        ) : moduloActivo ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <button onClick={() => { setModuloActivo(null); setRetro(null); }}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              ← Módulos
            </button>
            {cargandoRetro ? (
              <p className="text-center text-sm text-gray-400 py-6">Cargando respuestas...</p>
            ) : retro ? (
              <RetroalimentacionExamen resultado={retro} />
            ) : (
              <p className="text-center text-sm text-gray-400 py-6">No se pudieron cargar las respuestas.</p>
            )}
          </div>
        ) : seccionActiva ? (
          <div className="space-y-5">
            <button onClick={() => setSeccionActivaId(null)}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              ← Secciones
            </button>
            {seccionActiva.modulos.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
                <p className="text-gray-400 text-sm">Esta sección no tiene módulos todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {seccionActiva.modulos.map(item => (
                  <TarjetaModuloOperador key={item.modulo.id} item={item} onVer={abrirRetro} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {(() => {
              const todosLosModulos = secciones.flatMap(s => s.modulos || []);
              const completadosTotal = todosLosModulos.filter(m => m.estado === "completado").length;
              const pctTotal = todosLosModulos.length ? Math.round((completadosTotal / todosLosModulos.length) * 100) : 0;
              return (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-700">Avance general</h3>
                    <span className="text-sm font-bold text-[#802907]">{pctTotal}%</span>
                  </div>
                  <div className="rounded-full bg-gray-200 h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full bg-[#802907] transition-all" style={{ width: `${pctTotal}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{completadosTotal} de {todosLosModulos.length} módulo(s) completados</p>
                </div>
              );
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {secciones.map(secData => {
                if (!secData.modulos?.length) return null;
                return (
                  <TarjetaSeccionEmpleado
                    key={secData.seccion.id}
                    seccion={secData.seccion}
                    modulos={secData.modulos}
                    desbloqueada={secData.desbloqueada !== false}
                    seccionRequerida={secData.seccion_requerida}
                    onClick={() => setSeccionActivaId(secData.seccion.id)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VistaAdmin() {
  const [datos, setDatos] = useState({ progresos: [], resumen_modulos: [] });
  const [pieData, setPieData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscarUser, setBuscarUser] = useState("");
  const [filtroSec, setFiltroSec] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [operadorSeleccionado, setOperadorSeleccionado] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [rAdmin, rPie] = await Promise.all([
        axios.get(`${API}/api/progreso/admin`),
        axios.get(`${API}/api/progreso/por-seccion`),
      ]);
      setDatos(rAdmin.data);
      setPieData(rPie.data);
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar el reporte.", confirmButtonColor: "#802907" });
    } finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // 1. Filtrar SOLO operadores (Por rol si existe, o buscando la palabra 'operador' en el nombre/usuario)
  const soloOperadores = datos.progresos.filter(p =>
    (p.rol && p.rol.toLowerCase().includes("operador")) ||
    p.usuario?.toLowerCase().includes("operador") ||
    p.usuario_login?.toLowerCase().includes("operador")
  );

  // 2. Aplicar filtros de la barra superior a los cursos
  const cursosFiltrados = soloOperadores.filter(p => {
    const okSec = filtroSec ? String(p.seccion_id) === filtroSec : true;
    const okEst = filtroEstado ? p.estado === filtroEstado : true;
    return okSec && okEst;
  });

  // 3. Agrupar los cursos filtrados por Usuario para mostrar en el DataTable
  const usuariosAgrupados = Object.values(cursosFiltrados.reduce((acc, p) => {
    const key = p.usuario_login;
    if (!acc[key]) {
      acc[key] = { usuario: p.usuario, usuario_login: p.usuario_login, user_id: p.user_id, socio: p.socio, cursos: [] };
    }
    acc[key].cursos.push(p);
    return acc;
  }, {}));

  // 4. Aplicar el buscador de texto libre sobre los usuarios ya agrupados
  const dataTableData = usuariosAgrupados.filter(u =>
    buscarUser === "" ||
    u.usuario.toLowerCase().includes(buscarUser.toLowerCase()) ||
    u.usuario_login.toLowerCase().includes(buscarUser.toLowerCase())
  );

  // Opciones del select de secciones
  const seccionesUnicas = [...new Map(
    datos.progresos.filter(p => p.seccion_id).map(p => [p.seccion_id, { id: p.seccion_id, nombre: p.seccion }])
  ).values()];

  // Configuración de estilos para el DataTable
  const customStyles = {
    tableWrapper: { style: { borderTop: '1px solid #e5e7eb' } },
    headRow: { style: { backgroundColor: '#f9fafb', borderBottomWidth: '1px', borderBottomColor: '#e5e7eb' } },
    headCells: { style: { color: '#374151', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' } },
    rows: { style: { fontSize: '0.875rem', color: '#4b5563', backgroundColor: '#ffffff' } },
  };

  // Columnas principales de Operadores
  const columnas = useMemo(() => [
    {
      name: 'Operador',
      selector: row => row.usuario,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <p className="font-semibold text-gray-900">{row.usuario}</p>
          <p className="text-xs text-gray-500">@{row.usuario_login}</p>
        </div>
      )
    },
    {
      name: 'Socio',
      selector: row => row.socio || '',
      sortable: true,
      cell: row => row.socio
        ? <span className="text-sm text-gray-700">{row.socio}</span>
        : <span className="text-xs text-gray-400">Sin socio</span>
    },
    {
      name: 'Cursos Asignados (Filtrados)',
      selector: row => row.cursos.length,
      sortable: true,
      center: true,
      cell: row => <span className="font-medium text-gray-700">{row.cursos.length} módulos</span>
    },
    {
      name: 'Completados',
      selector: row => row.cursos.filter(c => c.estado === 'completado').length,
      sortable: true,
      center: true,
      cell: row => {
        const completados = row.cursos.filter(c => c.estado === 'completado').length;
        const total = row.cursos.length;
        const pct = total > 0 ? Math.round((completados / total) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${pct}%` }}></div>
            </div>
            <span className="text-xs font-bold text-gray-600">{pct}%</span>
          </div>
        );
      }
    }
  ], []);

  // Componente del buscador que va adentro del DataTable
  const BuscadorDataTable = useMemo(() => (
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <label className="text-sm font-semibold text-gray-600 hidden sm:block">Buscar Operador:</label>
      <input
        type="text"
        placeholder="Nombre o usuario..."
        value={buscarUser}
        onChange={e => setBuscarUser(e.target.value)}
        className="rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none w-full sm:w-64 shadow-sm"
      />
    </div>
  ), [buscarUser]);

  if (cargando) return <p className="text-center text-sm text-gray-400 py-12">Cargando reporte...</p>;

  return (
    <div className="space-y-6">
      {/* Gráficas de pastel por sección */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4 border-b pb-2">Avance Global por Sección</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {pieData.map(sec => (
              <div key={sec.seccion_id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-gray-700 text-center wrap-break-word w-full line-clamp-2 min-h-8" title={sec.nombre}>
                  {sec.nombre}
                </p>
                <div className="py-2">
                  <GraficaPastel datos={sec} size={130} />
                </div>
                <LeyendaPastel datos={sec} />
                <p className="text-[10px] text-gray-400 mt-2 border-t pt-2 w-full text-center">
                  {sec.total} capacitación(es) registrada(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros para la tabla de operadores */}
      <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <span className="text-sm font-bold text-gray-700 mr-2">Filtros de cursos:</span>
        <select value={filtroSec} onChange={e => setFiltroSec(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#802907]">
          <option value="">Todas las secciones</option>
          {seccionesUnicas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#802907]">
          <option value="">Todos los estados</option>
          <option value="en_progreso">En Progreso</option>
          <option value="completado">Completado</option>
          <option value="reprobado">Reprobado</option>
        </select>
        <button onClick={cargar} className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
          Actualizar Datos
        </button>
        {(filtroSec || filtroEstado) && (
          <button onClick={() => { setFiltroSec(""); setFiltroEstado(""); }}
            className="text-xs font-semibold text-[#802907] hover:underline ml-2">
            Limpiar filtros de cursos
          </button>
        )}
      </div>

      {/* Tabla de Operadores: al hacer clic en una fila se abre su progreso en tarjetas */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <DataTable
          columns={columnas}
          data={dataTableData}
          onRowClicked={row => setOperadorSeleccionado(row)}
          pointerOnHover
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50]}
          highlightOnHover
          responsive
          customStyles={customStyles}
          subHeader
          subHeaderComponent={BuscadorDataTable}
          noDataComponent={<div className="p-8 text-gray-500 text-center">No se encontraron operadores con estos filtros.</div>}
        />
      </div>

      {operadorSeleccionado && (
        <VisorProgresoOperador
          usuarioId={operadorSeleccionado.user_id}
          usuarioNombre={operadorSeleccionado.usuario}
          moduloInicialId={null}
          onCerrar={() => setOperadorSeleccionado(null)}
        />
      )}
    </div>
  );
}

// VISTA DE EMPLEADO 
function TarjetaSeccionEmpleado({ seccion, modulos, desbloqueada, seccionRequerida, onClick }) {
  const completados = modulos.filter(m => m.estado === "completado").length;
  const pct = modulos.length ? Math.round((completados / modulos.length) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm p-6 cursor-pointer transition-all group relative ${desbloqueada ? "hover:border-[#802907] hover:shadow-md" : "opacity-70"}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${pct === 100 ? "bg-green-500" : "bg-gray-300"}`} />
        <h3 className="font-bold text-gray-800 truncate group-hover:text-[#802907] transition-colors">
          {seccion.nombre}
        </h3>
        {!desbloqueada && <span className="text-base shrink-0">🔒</span>}
      </div>
      {seccion.descripcion && (
        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{seccion.descripcion}</p>
      )}

      {desbloqueada ? (
        <>
          <p className="text-xs text-gray-500 mt-3 font-medium">{modulos.length} módulo(s)</p>
          {/* Barra de progreso */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 rounded-full bg-gray-200 h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full bg-[#802907] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 shrink-0">{completados}/{modulos.length} completados</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-amber-600 mt-3 font-medium">🔒 Necesitas completar "{seccionRequerida}" primero.</p>
      )}

      <div className="absolute bottom-4 right-4 text-gray-200 group-hover:text-[#802907] transition-colors text-lg">
        →
      </div>
    </div>
  );
}


function TarjetaModuloEmpleado({ item, onAbrir }) {
  const { modulo, estado, puntaje, intentos, tiene_examen } = item;
  const desbloqueado = item.desbloqueado !== false;
  const imgSrc = modulo.imagen_url || null;
  const necesitaRepaso = estado === "reprobado" && item.intentos_restantes === 0;

  const botonLabel = () => {
    if (!desbloqueado) return "Bloqueado";
    if (necesitaRepaso) return "Repasar contenido";
    if (estado === "pendiente") return "Iniciar";
    if (estado === "en_progreso") return "Continuar";
    return "Reintentar";
  };

  return (
    <div
      onClick={() => desbloqueado && onAbrir(modulo.id)}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col group transition-shadow ${desbloqueado ? "cursor-pointer hover:shadow-md" : "opacity-70"}`}
    >
      {/* Zona de imagen */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt={modulo.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
            {modulo.file_type === "pdf" ? "📄" : modulo.file_type === "presentacion" ? "🖼️" : modulo.file_type === "video" ? "🎬" : "📦"}
          </div>
        )}
        {!desbloqueado && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-3xl">🔒</div>
        )}
        {modulo.file_type && (
          <span className={`absolute top-2 left-2 text-[10px] font-bold rounded px-1.5 py-0.5 ${modulo.file_type === "pdf" ? "bg-red-600 text-white"
              : modulo.file_type === "presentacion" ? "bg-purple-600 text-white"
                : "bg-blue-600 text-white"
            }`}>
            {modulo.file_type === "presentacion" ? "PRESENTACIÓN" : modulo.file_type.toUpperCase()}
          </span>
        )}
        <span className="absolute top-2 right-2"><Badge estado={estado} /></span>
      </div>

      {/* Info del módulo */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{modulo.nombre}</h4>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{modulo.descripcion}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[10px]">
          {tiene_examen && <span className="font-bold rounded-full px-2 py-0.5 bg-purple-100 text-purple-700">📝 Examen</span>}
          {intentos > 0 && <span className="text-gray-400">🔁 {intentos} intento(s)</span>}
          {puntaje !== null && (
            <span className={`font-bold ${puntaje >= 70 ? "text-green-600" : "text-red-500"}`}>{puntaje}%</span>
          )}
          {!desbloqueado && <span className="text-gray-400">🔒 Requiere aprobar: {item.requiere_modulo || "el módulo anterior"}</span>}
          {desbloqueado && necesitaRepaso && <span className="font-bold text-amber-600">🔒 Repasa el contenido para reintentar</span>}
        </div>

        <button
          onClick={e => { e.stopPropagation(); if (desbloqueado) onAbrir(modulo.id); }}
          disabled={!desbloqueado}
          title={!desbloqueado ? `Aprueba el examen de "${item.requiere_modulo || "el módulo anterior"}" (mínimo 70%) para desbloquearlo` : undefined}
          className={`mt-auto rounded-lg px-3 py-1.5 text-xs font-semibold ${desbloqueado ? "bg-[#802907] text-white hover:bg-[#5a1b04]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
          {botonLabel()}
        </button>
      </div>
    </div>
  );
}

// ─── Vista Empleado ──────────────────────────────────────────────────────────
function VistaEmpleado() {
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seccionActivaId, setSeccionActivaId] = useState(null);
  const [cursoModuloId, setCursoModuloId] = useState(null);

  // silencioso=true evita el parpadeo de "Cargando..." cuando se refresca el
  // progreso mientras el visor de curso sigue abierto (p. ej. tras un examen).
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const res = await axios.get(`${API}/api/progreso/mio`);
      setSecciones(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar tus capacitaciones.", confirmButtonColor: "#802907" });
    } finally { if (!silencioso) setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) return <p className="text-center text-sm text-gray-400 py-12">Cargando módulos...</p>;

  const hayModulos = secciones.some(s => s.modulos?.length > 0);
  if (!hayModulos) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-400 text-sm">No hay módulos disponibles en este momento.</p>
      </div>
    );
  }

  const seccionActiva = secciones.find(s => s.seccion.id === seccionActivaId);

  return (
    <div className="space-y-5">
      {seccionActiva ? (
        // ── Módulos de la sección activa, en tarjetas ──
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setSeccionActivaId(null)}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              ← Secciones
            </button>
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-800">{seccionActiva.seccion.nombre}</span>
          </div>
          {seccionActiva.seccion.descripcion && (
            <p className="text-sm text-gray-500">{seccionActiva.seccion.descripcion}</p>
          )}

          {seccionActiva.modulos.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
              <p className="text-gray-400 text-sm">Esta sección no tiene módulos todavía.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {seccionActiva.modulos.map(item => (
                <TarjetaModuloEmpleado key={item.modulo.id} item={item} onAbrir={setCursoModuloId} />
              ))}
            </div>
          )}
        </>
      ) : (
        // ── Lista de secciones, en tarjetas ─
        <>
          {(() => {
            const todosLosModulos = secciones.flatMap(s => s.modulos || []);
            const completadosTotal = todosLosModulos.filter(m => m.estado === "completado").length;
            const pctTotal = todosLosModulos.length ? Math.round((completadosTotal / todosLosModulos.length) * 100) : 0;
            return (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-700">Tu avance general</h3>
                  <span className="text-sm font-bold text-[#802907]">{pctTotal}%</span>
                </div>
                <div className="rounded-full bg-gray-200 h-2.5 overflow-hidden">
                  <div className="h-2.5 rounded-full bg-[#802907] transition-all" style={{ width: `${pctTotal}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">{completadosTotal} de {todosLosModulos.length} módulo(s) completados</p>
              </div>
            );
          })()}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {secciones.map(secData => {
              if (!secData.modulos?.length) return null;
              const desbloqueada = secData.desbloqueada !== false;
              return (
                <TarjetaSeccionEmpleado
                  key={secData.seccion.id}
                  seccion={secData.seccion}
                  modulos={secData.modulos}
                  desbloqueada={desbloqueada}
                  seccionRequerida={secData.seccion_requerida}
                  onClick={() => {
                    if (!desbloqueada) {
                      Swal.fire({
                        icon: "warning",
                        title: "Sección bloqueada",
                        text: `Debes completar la sección "${secData.seccion_requerida}" antes de acceder a esta.`,
                        confirmButtonColor: "#802907",
                      });
                      return;
                    }
                    setSeccionActivaId(secData.seccion.id);
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {cursoModuloId && (
        <VisorCurso
          secciones={secciones}
          moduloInicialId={cursoModuloId}
          onCerrar={() => { setCursoModuloId(null); cargar(); }}
          onProgresoActualizado={() => cargar(true)}
        />
      )}
    </div>
  );
}

// ─── Componente raíz ─────────────────────────────────────────────────────────
function Capacitaciones() {
  const storedUser = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("user") || "null") : null;
  const rol = storedUser?.puesto?.nombre || null;
  const permisos = storedUser?.permissions || {};
  const esAdmin = rol === "SistemasAdmin" || permisos.edit_trainings || permisos.edit_capacitaciones_course;

  const [vista, setVista] = useState(esAdmin ? "admin" : "empleado");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {esAdmin && vista === "admin" ? "Progreso de Capacitaciones" : "Mis Capacitaciones"}
          </h2>
          <p className="text-sm text-gray-500">
            {esAdmin && vista === "admin"
              ? "Avance de todos los empleados por sección y módulo."
              : "Revisa el contenido de cada módulo y rinde tu examen."}
          </p>
        </div>
        {esAdmin && (
          <div className="flex rounded-lg border border-gray-200 bg-white p-1 shrink-0 shadow-sm">
            {[["admin", "Reporte General"], ["empleado", "Vista Empleado"]].map(([k, l]) => (
              <button key={k} onClick={() => setVista(k)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${vista === k ? "bg-[#802907] text-white" : "text-gray-600 hover:text-gray-800"}`}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {esAdmin && vista === "admin" ? <VistaAdmin /> : <VistaEmpleado />}
    </div>
  );
}

export default Capacitaciones;