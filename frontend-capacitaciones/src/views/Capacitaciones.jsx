import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ESTADOS = {
  pendiente:   { label: "Pendiente",   cls: "bg-gray-100 text-gray-600" },
  en_progreso: { label: "En Progreso", cls: "bg-yellow-100 text-yellow-700" },
  completado:  { label: "Completado",  cls: "bg-green-100 text-green-700" },
  reprobado:   { label: "Reprobado",   cls: "bg-red-100 text-red-600" },
};

function Badge({ estado }) {
  const { label, cls } = ESTADOS[estado] || ESTADOS.pendiente;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

// ─── Gráfica de pastel SVG ───────────────────────────────────────────────────
const PIE_COLORS = {
  completados: "#16a34a",
  en_progreso: "#d97706",
  reprobados:  "#dc2626",
  pendientes:  "#d1d5db",
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
    { key: "reprobados",  val: reprobados,  color: PIE_COLORS.reprobados },
    { key: "pendientes",  val: pendientes,  color: PIE_COLORS.pendientes },
  ].filter(s => s.val > 0);

  const r = size / 2;
  const cx = r;
  const cy = r;
  const radio = r - 4;

  let acum = 0;
  const arcos = segmentos.map(s => {
    const inicio = acum;
    const fin    = acum + (s.val / total) * 2 * Math.PI;
    acum = fin;
    const x1 = cx + radio * Math.cos(inicio - Math.PI / 2);
    const y1 = cy + radio * Math.sin(inicio - Math.PI / 2);
    const x2 = cx + radio * Math.cos(fin - Math.PI / 2);
    const y2 = cy + radio * Math.sin(fin - Math.PI / 2);
    const grande = fin - inicio > Math.PI ? 1 : 0;
    return { ...s, d: `M ${cx} ${cy} L ${x1} ${y1} A ${radio} ${radio} 0 ${grande} 1 ${x2} ${y2} Z` };
  });

  // Si solo hay un tipo, círculo completo
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
    { key: "reprobados",  label: "Reprobados",  val: datos.reprobados,  color: PIE_COLORS.reprobados },
    { key: "pendientes",  label: "Pendientes",  val: datos.pendientes,  color: PIE_COLORS.pendientes },
  ];
  return (
    <div className="space-y-1 text-xs">
      {items.map(it => (
        <div key={it.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: it.color }} />
          <span className="text-gray-600">{it.label}: <strong>{it.val}</strong></span>
        </div>
      ))}
    </div>
  );
}

// ─── Visor de archivo ─────────────────────────────────────────────────────────
function VisorArchivo({ filePath, fileType }) {
  if (!filePath) return null;
  const src = `/modulos/${filePath}`;
  if (fileType === "video") {
    return (
      <div className="rounded-lg overflow-hidden bg-black">
        <video src={src} controls className="w-full max-h-80 object-contain" />
      </div>
    );
  }
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <embed src={src} type="application/pdf" className="w-full h-96" />
      <p className="text-xs text-center text-gray-400 py-1">
        Si el PDF no se muestra, <a href={src} target="_blank" rel="noreferrer" className="text-blue-600 underline">ábrelo aquí</a>.
      </p>
    </div>
  );
}

// ─── Examen ──────────────────────────────────────────────────────────────────
function SeccionExamen({ moduloId, onTerminar }) {
  const [preguntas, setPreguntas]   = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando]     = useState(false);
  const [resultado, setResultado]   = useState(null);
  const [sinExamen, setSinExamen]   = useState(false);

  const cargarExamen = useCallback(async () => {
    setCargando(true); setSinExamen(false); setResultado(null); setRespuestas({});
    try {
      const res = await axios.get(`${API}/api/modulos/${moduloId}/examen`);
      setPreguntas(res.data.preguntas || []);
    } catch (err) {
      if (err.response?.status === 404) setSinExamen(true);
      else Swal.fire({ icon: "error", title: "Error al cargar el examen.", confirmButtonColor: "#802907" });
    } finally { setCargando(false); }
  }, [moduloId]);

  useEffect(() => { cargarExamen(); }, [cargarExamen]);

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
      onTerminar();
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al enviar.", confirmButtonColor: "#802907" });
    } finally { setEnviando(false); }
  };

  if (cargando)  return <p className="text-center text-sm text-gray-400 py-6">Cargando examen...</p>;
  if (sinExamen) return <p className="text-center text-sm text-gray-400 py-6">Este módulo aún no tiene examen configurado.</p>;

  if (resultado) {
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
          <button onClick={cargarExamen} className="mt-3 rounded-lg border px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
            Volver a intentar
          </button>
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

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 font-medium">{preguntas.length} pregunta(s) — necesitas 70% para aprobar</p>
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

// ─── Modal tomar módulo ──────────────────────────────────────────────────────
function ModalTomarModulo({ item, onCerrar }) {
  const { modulo, estado } = item;
  const [tab, setTab]           = useState("contenido");
  const [yaIniciado, setInit]   = useState(estado !== "pendiente");

  useEffect(() => {
    if (!yaIniciado) {
      axios.post(`${API}/api/modulos/${modulo.id}/iniciar`)
        .then(() => setInit(true))
        .catch(() => setInit(true));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <div>
            <h3 className="font-bold text-gray-800">{modulo.nombre}</h3>
            <p className="text-xs text-gray-500 line-clamp-1">{modulo.descripcion}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold ml-4">✕</button>
        </div>
        <div className="flex border-b shrink-0">
          {[["contenido", "📄 Contenido"], ["examen", "📝 Examen"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-2.5 text-sm font-semibold transition-colors ${tab === k ? "border-b-2 border-[#802907] text-[#802907]" : "text-gray-500 hover:text-gray-700"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "contenido" ? (
            <div className="space-y-4">
              {modulo.file_path
                ? <VisorArchivo filePath={modulo.file_path} fileType={modulo.file_type} />
                : <p className="text-center text-sm text-gray-400 py-8">Este módulo no tiene archivo adjunto.</p>}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800 font-medium">¿Ya revisaste el contenido?</p>
                <p className="text-xs text-blue-600 mt-1">Ve a la pestaña <strong>Examen</strong> cuando estés listo.</p>
              </div>
            </div>
          ) : (
            <SeccionExamen moduloId={modulo.id} onTerminar={onCerrar} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vista Admin ─────────────────────────────────────────────────────────────
function VistaAdmin() {
  const [datos, setDatos]             = useState({ progresos: [], resumen_modulos: [] });
  const [pieData, setPieData]         = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [buscarUser, setBuscarUser]   = useState("");
  const [filtroSec, setFiltroSec]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

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

  // IDs únicos de secciones para el filtro
  const seccionesUnicas = [...new Map(
    datos.progresos.filter(p => p.seccion_id).map(p => [p.seccion_id, { id: p.seccion_id, nombre: p.seccion }])
  ).values()];

  const progFiltrados = datos.progresos.filter(p => {
    const okUser = buscarUser ? (p.usuario?.toLowerCase().includes(buscarUser.toLowerCase()) || p.usuario_login?.toLowerCase().includes(buscarUser.toLowerCase())) : true;
    const okSec  = filtroSec  ? String(p.seccion_id) === filtroSec : true;
    const okEst  = filtroEstado ? p.estado === filtroEstado : true;
    return okUser && okSec && okEst;
  });

  if (cargando) return <p className="text-center text-sm text-gray-400 py-12">Cargando reporte...</p>;

  return (
    <div className="space-y-6">
      {/* Gráficas de pastel por sección */}
      {pieData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Avance por Sección</h3>
          <div className="flex flex-wrap gap-4">
            {pieData.map(sec => (
              <div key={sec.seccion_id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col items-center gap-3 min-w-47.5">
                <p className="text-xs font-bold text-gray-700 text-center line-clamp-2">{sec.nombre}</p>
                <GraficaPastel datos={sec} size={110} />
                <LeyendaPastel datos={sec} />
                <p className="text-[10px] text-gray-400">{sec.total} usuario(s) total</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <input value={buscarUser} onChange={e => setBuscarUser(e.target.value)}
          placeholder="Buscar usuario..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#802907] min-w-45" />
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
        <button onClick={cargar} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Actualizar
        </button>
        {(buscarUser || filtroSec || filtroEstado) && (
          <button onClick={() => { setBuscarUser(""); setFiltroSec(""); setFiltroEstado(""); }}
            className="text-xs text-[#802907] hover:underline">
            Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{progFiltrados.length} registro(s)</span>
      </div>

      {/* Tabla de progreso */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-x-auto shadow-sm">
        {progFiltrados.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No hay registros que coincidan con los filtros.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-600 font-semibold">
              <tr>
                <th className="px-5 py-3 text-left">Usuario</th>
                <th className="px-5 py-3 text-left">Sección</th>
                <th className="px-5 py-3 text-left">Módulo</th>
                <th className="px-5 py-3 text-center">Estado</th>
                <th className="px-5 py-3 text-center">Puntaje</th>
                <th className="px-5 py-3 text-center">Intentos</th>
                <th className="px-5 py-3 text-left">Última actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {progFiltrados.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{p.usuario}</p>
                    <p className="text-xs text-gray-400">@{p.usuario_login}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{p.seccion || "—"}</td>
                  <td className="px-5 py-3 text-gray-700">{p.modulo}</td>
                  <td className="px-5 py-3 text-center"><Badge estado={p.estado} /></td>
                  <td className="px-5 py-3 text-center">
                    {p.puntaje !== null
                      ? <span className={`font-bold ${p.puntaje >= 70 ? "text-green-600" : "text-red-500"}`}>{p.puntaje}%</span>
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600">{p.intentos}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {p.completed_at
                      ? new Date(p.completed_at).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })
                      : p.started_at
                        ? new Date(p.started_at).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Vista Empleado ──────────────────────────────────────────────────────────
function VistaEmpleado() {
  const [secciones, setSecciones]       = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [abiertos, setAbiertos]         = useState({});
  const [moduloActivo, setModuloActivo] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${API}/api/progreso/mio`);
      setSecciones(res.data);
      // Abrir todas las secciones por defecto
      const open = {};
      res.data.forEach((s, i) => { open[i] = true; });
      setAbiertos(open);
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar tus capacitaciones.", confirmButtonColor: "#802907" });
    } finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggle = i => setAbiertos(prev => ({ ...prev, [i]: !prev[i] }));

  const botonLabel = estado => {
    if (estado === "pendiente")   return "Iniciar";
    if (estado === "en_progreso") return "Continuar";
    return "Reintentar";
  };

  if (cargando) return <p className="text-center text-sm text-gray-400 py-12">Cargando módulos...</p>;

  const hayModulos = secciones.some(s => s.modulos?.length > 0);
  if (!hayModulos) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-400 text-sm">No hay módulos disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {secciones.map((secData, idx) => {
        const { seccion, modulos } = secData;
        if (!modulos || modulos.length === 0) return null;
        const completados = modulos.filter(m => m.estado === "completado").length;
        const pct = Math.round((completados / modulos.length) * 100);

        return (
          <div key={seccion.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Cabecera sección (acordeón) */}
            <button onClick={() => toggle(idx)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{seccion.nombre}</span>
                  <span className="text-xs text-gray-400">{modulos.length} módulo(s)</span>
                </div>
                {/* Barra de progreso */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 rounded-full bg-gray-200 h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[#802907] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{completados}/{modulos.length} completados</span>
                </div>
              </div>
              <span className="text-gray-400 text-sm shrink-0">{abiertos[idx] ? "▲" : "▼"}</span>
            </button>

            {/* Módulos (lista colapsable) */}
            {abiertos[idx] && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {modulos.map(item => {
                  const { modulo, estado, puntaje, intentos, tiene_examen } = item;
                  return (
                    <div key={modulo.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                      {/* Indicador de estado */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${estado === "completado" ? "bg-green-100 text-green-700" : estado === "reprobado" ? "bg-red-100 text-red-600" : estado === "en_progreso" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-400"}`}>
                        {estado === "completado" ? "✓" : estado === "reprobado" ? "✗" : "○"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{modulo.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          {modulo.file_type && <span>{modulo.file_type === "pdf" ? "📄 PDF" : "🎬 Video"}</span>}
                          {tiene_examen && <span>📝 Examen</span>}
                          {intentos > 0 && <span>🔁 {intentos} intento(s)</span>}
                        </div>
                      </div>

                      {puntaje !== null && (
                        <span className={`text-sm font-bold shrink-0 ${puntaje >= 70 ? "text-green-600" : "text-red-500"}`}>
                          {puntaje}%
                        </span>
                      )}

                      <Badge estado={estado} />

                      <button
                        onClick={() => setModuloActivo(item)}
                        className="shrink-0 rounded-lg bg-[#802907] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5a1b04]">
                        {botonLabel(estado)}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {moduloActivo && (
        <ModalTomarModulo item={moduloActivo} onCerrar={() => { setModuloActivo(null); cargar(); }} />
      )}
    </div>
  );
}

// ─── Componente raíz ─────────────────────────────────────────────────────────
function Capacitaciones() {
  const storedUser = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("user") || "null") : null;
  const rol        = storedUser?.puesto?.nombre || null;
  const permisos   = storedUser?.permissions || {};
  const esAdmin    = rol === "SistemasAdmin" || permisos.edit_trainings || permisos.edit_capacitaciones_course;

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
          <div className="flex rounded-lg border border-gray-200 bg-white p-1 shrink-0">
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
