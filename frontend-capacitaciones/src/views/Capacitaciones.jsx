import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";

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

// ─── Visor de archivo y Examen ───────────────────────────────────────────────
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

function SeccionExamen({ moduloId, onTerminar }) {
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [sinExamen, setSinExamen] = useState(false);

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

  if (cargando) return <p className="text-center text-sm text-gray-400 py-6">Cargando examen...</p>;
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

function ModalTomarModulo({ item, onCerrar }) {
  const { modulo, estado } = item;
  const [tab, setTab] = useState("contenido");
  const [yaIniciado, setInit] = useState(estado !== "pendiente");

  useEffect(() => {
    if (!yaIniciado) {
      axios.post(`${API}/api/modulos/${modulo.id}/iniciar`)
        .then(() => setInit(true))
        .catch(() => setInit(true));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800">{modulo.nombre}</h3>
            <p className="text-xs text-gray-500 line-clamp-1">{modulo.descripcion}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold ml-4">✕</button>
        </div>
        <div className="flex border-b shrink-0 px-6 pt-2 bg-gray-50">
          {[["contenido", "📄 Contenido"], ["examen", "📝 Examen"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-2 text-sm font-semibold transition-colors rounded-t-lg ${tab === k ? "border-b-2 border-[#802907] text-[#802907] bg-white" : "text-gray-500 hover:text-gray-700"}`}>
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

// Componente para expandir filas (Muestra los cursos de un operador)
const CursosExpandidos = ({ data }) => {
  return (
    <div className="p-6 bg-slate-50 border-b border-gray-200">
      <h4 className="font-bold text-gray-700 mb-3 text-sm">Historial de Módulos de {data.usuario}</h4>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600 font-semibold border-b">
            <tr>
              <th className="px-4 py-3">Módulo</th>
              <th className="px-4 py-3">Sección</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Puntaje</th>
              <th className="px-4 py-3 text-center">Intentos</th>
              <th className="px-4 py-3 text-center">Actividad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.cursos.map(curso => (
              <tr key={curso.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{curso.modulo}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{curso.seccion || "—"}</td>
                <td className="px-4 py-3 text-center"><Badge estado={curso.estado} /></td>
                <td className="px-4 py-3 text-center">
                  {curso.puntaje !== null
                    ? <span className={`font-bold ${curso.puntaje >= 70 ? "text-green-600" : "text-red-500"}`}>{curso.puntaje}%</span>
                    : "—"}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{curso.intentos}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-500">
                  {curso.completed_at
                    ? new Date(curso.completed_at).toLocaleDateString("es-GT")
                    : curso.started_at
                      ? new Date(curso.started_at).toLocaleDateString("es-GT")
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function VistaAdmin() {
  const [datos, setDatos] = useState({ progresos: [], resumen_modulos: [] });
  const [pieData, setPieData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscarUser, setBuscarUser] = useState("");
  const [filtroSec, setFiltroSec] = useState("");
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
      acc[key] = { usuario: p.usuario, usuario_login: p.usuario_login, cursos: [] };
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
                <p className="text-xs font-bold text-gray-700 text-center break-words w-full line-clamp-2 min-h-[2rem]" title={sec.nombre}>
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

      {/* Tabla Expandible de Operadores */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <DataTable
          columns={columnas}
          data={dataTableData}
          expandableRows
          expandableRowsComponent={CursosExpandidos}
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
    </div>
  );
}

// ─── Vista Empleado ──────────────────────────────────────────────────────────
function VistaEmpleado() {
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abiertos, setAbiertos] = useState({});
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
    if (estado === "pendiente") return "Iniciar";
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