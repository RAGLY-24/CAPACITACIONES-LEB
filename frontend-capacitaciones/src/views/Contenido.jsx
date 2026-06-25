import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Íconos ──────────────────────────────────────────────────────────────────
const Ico = {
  plus:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  edit:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.5-6.5a2.121 2.121 0 013 3L12 14H9v-3z"/></svg>,
  trash:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  qa:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  file:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
  video:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  check:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
};

// ─── Modal Sección ────────────────────────────────────────────────────────────
function ModalSeccion({ tipo, datos, onGuardar, onCerrar }) {
  const [form, setForm]     = useState({ nombre: datos?.nombre || "", descripcion: datos?.descripcion || "", estado: datos?.estado || "Activo" });
  const [errs, setErrs]     = useState({});
  const [saving, setSaving] = useState(false);

  const handle = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errs[name]) setErrs(p => ({ ...p, [name]: null }));
  };

  const submit = async e => {
    e.preventDefault();
    const v = {};
    if (!form.nombre || form.nombre.length < 3) v.nombre = "Mínimo 3 caracteres.";
    if (form.nombre.length > 150) v.nombre = "Máximo 150 caracteres.";
    if (Object.keys(v).length) { setErrs(v); return; }
    setSaving(true);
    try {
      if (tipo === "crear") await axios.post(`${API}/api/secciones`, form);
      else await axios.put(`${API}/api/secciones/${datos.id}`, form);
      onGuardar();
    } catch (err) {
      const backErrs = err.response?.data?.errors || {};
      if (backErrs.nombre) {
        setErrs(p => ({ ...p, nombre: backErrs.nombre[0] }));
      } else {
        Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al guardar.", confirmButtonColor: "#802907" });
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-bold text-gray-800">{tipo === "crear" ? "Nueva Sección" : "Editar Sección"}</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Nombre <span className="text-red-500">*</span></label>
            <input name="nombre" value={form.nombre} onChange={handle} maxLength={150}
              className={`mt-1 w-full rounded border p-2 text-sm focus:outline-none focus:border-[#802907] ${errs.nombre ? "border-red-500" : "border-gray-300"}`}
              placeholder="Ej: Módulo de Seguridad Laboral" />
            {errs.nombre && <p className="text-xs text-red-500 mt-1">{errs.nombre}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handle} rows={3} maxLength={1000}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]"
              placeholder="Descripción breve de la sección..." />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Estado</label>
            <select name="estado" value={form.estado} onChange={handle}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onCerrar} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={saving}
              className="rounded bg-[#802907] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04] disabled:opacity-60">
              {saving ? "Guardando..." : tipo === "crear" ? "Crear Sección" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Módulo ─────────────────────────────────────────────────────────────
function ModalModulo({ tipo, seccionId, datos, onGuardar, onCerrar }) {
  const [form, setForm]     = useState({
    nombre:      datos?.nombre || "",
    descripcion: datos?.descripcion || "",
    estado:      datos?.estado || "Activo",
    archivo:     null,
  });
  const [errs, setErrs]     = useState({});
  const [saving, setSaving] = useState(false);

  const handle = e => {
    const { name, value, files } = e.target;
    setForm(p => ({ ...p, [name]: files ? files[0] : value }));
    if (errs[name]) setErrs(p => ({ ...p, [name]: null }));
  };

  const submit = async e => {
    e.preventDefault();
    const v = {};
    if (!form.nombre || form.nombre.length < 5) v.nombre = "Mínimo 5 caracteres.";
    if (form.nombre.length > 150) v.nombre = "Máximo 150 caracteres.";
    if (!form.descripcion || form.descripcion.length < 10) v.descripcion = "Mínimo 10 caracteres.";
    if (Object.keys(v).length) { setErrs(v); return; }
    setSaving(true);

    const fd = new FormData();
    fd.append("seccion_id",  seccionId);
    fd.append("nombre",      form.nombre);
    fd.append("descripcion", form.descripcion);
    fd.append("estado",      form.estado);
    if (form.archivo) fd.append("archivo", form.archivo);

    try {
      if (tipo === "crear") {
        await axios.post(`${API}/api/modulos`, fd);
      } else {
        fd.append("_method", "PUT");
        await axios.post(`${API}/api/modulos/${datos.id}/update`, fd);
      }
      onGuardar();
    } catch (err) {
      const back = err.response?.data?.errors || {};
      const mapped = {};
      Object.keys(back).forEach(k => (mapped[k] = back[k][0]));
      if (Object.keys(mapped).length) setErrs(mapped);
      else Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al guardar.", confirmButtonColor: "#802907" });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-bold text-gray-800">{tipo === "crear" ? "Nuevo Módulo" : "Editar Módulo"}</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Nombre <span className="text-red-500">*</span></label>
            <input name="nombre" value={form.nombre} onChange={handle} maxLength={150}
              className={`mt-1 w-full rounded border p-2 text-sm focus:outline-none focus:border-[#802907] ${errs.nombre ? "border-red-500" : "border-gray-300"}`}
              placeholder="Ej: Uso correcto de EPP" />
            {errs.nombre && <p className="text-xs text-red-500 mt-1">{errs.nombre}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{form.nombre.length}/150</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Descripción <span className="text-red-500">*</span></label>
            <textarea name="descripcion" value={form.descripcion} onChange={handle} rows={3} maxLength={2000}
              className={`mt-1 w-full rounded border p-2 text-sm focus:outline-none focus:border-[#802907] ${errs.descripcion ? "border-red-500" : "border-gray-300"}`}
              placeholder="Objetivos y contenido del módulo..." />
            {errs.descripcion && <p className="text-xs text-red-500 mt-1">{errs.descripcion}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{form.descripcion.length}/2000</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Estado</label>
              <select name="estado" value={form.estado} onChange={handle}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]">
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Archivo (PDF / MP4)</label>
              <input type="file" name="archivo" accept=".pdf,.mp4,.webm" onChange={handle}
                className="mt-1 block w-full text-xs text-gray-500 file:rounded file:border-0 file:bg-[#802907] file:px-3 file:py-1.5 file:text-white hover:file:bg-[#5a1b04] cursor-pointer" />
              {tipo === "editar" && datos?.file_path && (
                <p className="text-xs text-gray-400 mt-0.5">Actual: <strong>{datos.file_type?.toUpperCase()}</strong></p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onCerrar} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={saving}
              className="rounded bg-[#802907] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04] disabled:opacity-60">
              {saving ? "Guardando..." : tipo === "crear" ? "Crear Módulo" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Constructor de examen ────────────────────────────────────────────────────
function PanelExamen({ modulo, onCerrar }) {
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [nueva, setNueva]         = useState(false);
  const [npTexto, setNpTexto]     = useState("");
  const [npOps, setNpOps]         = useState([
    { texto: "", es_correcta: true },
    { texto: "", es_correcta: false },
  ]);
  const [editId, setEditId]       = useState(null);
  const [editTexto, setEditTexto] = useState("");
  const [editOps, setEditOps]     = useState([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await axios.get(`${API}/api/modulos/${modulo.id}/preguntas`);
      setPreguntas(r.data);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  }, [modulo.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const setCorrectaNueva = i => setNpOps(o => o.map((x, idx) => ({ ...x, es_correcta: idx === i })));
  const setCorrectaEdit  = i => setEditOps(o => o.map((x, idx) => ({ ...x, es_correcta: idx === i })));

  const validarOps = (ops, texto) => {
    if (!texto.trim()) { Swal.fire({ icon: "warning", title: "Escribe el texto de la pregunta.", confirmButtonColor: "#802907" }); return false; }
    if (ops.some(o => !o.texto.trim())) { Swal.fire({ icon: "warning", title: "Completa el texto de todas las opciones.", confirmButtonColor: "#802907" }); return false; }
    if (!ops.some(o => o.es_correcta)) { Swal.fire({ icon: "warning", title: "Marca una opción como correcta (radio).", confirmButtonColor: "#802907" }); return false; }
    return true;
  };

  const guardarNueva = async () => {
    if (!validarOps(npOps, npTexto)) return;
    try {
      await axios.post(`${API}/api/modulos/${modulo.id}/preguntas`, { texto: npTexto, opciones: npOps });
      setNpTexto(""); setNpOps([{ texto: "", es_correcta: true }, { texto: "", es_correcta: false }]);
      setNueva(false); cargar();
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al guardar pregunta.", confirmButtonColor: "#802907" });
    }
  };

  const abrirEditar = p => {
    setEditId(p.id); setEditTexto(p.texto);
    setEditOps(p.opciones.map(o => ({ texto: o.texto, es_correcta: o.es_correcta })));
  };

  const guardarEdicion = async () => {
    if (!validarOps(editOps, editTexto)) return;
    try {
      await axios.put(`${API}/api/preguntas/${editId}`, { texto: editTexto, opciones: editOps });
      setEditId(null); cargar();
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al actualizar.", confirmButtonColor: "#802907" });
    }
  };

  const eliminar = async id => {
    const ok = await Swal.fire({ title: "¿Eliminar pregunta?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#6b7280", confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar" });
    if (!ok.isConfirmed) return;
    try { await axios.delete(`${API}/api/preguntas/${id}`); cargar(); }
    catch { Swal.fire({ icon: "error", title: "Error al eliminar.", confirmButtonColor: "#802907" }); }
  };

  const EditorOpciones = ({ ops, setOps, setCorrecta }) => (
    <div className="space-y-2 mt-2">
      {ops.map((op, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="radio" checked={op.es_correcta} onChange={() => setCorrecta(i)} className="accent-green-600 shrink-0" title="Marcar como correcta" />
          <input value={op.texto} onChange={e => setOps(o => { const c=[...o]; c[i]={...c[i],texto:e.target.value}; return c; })}
            placeholder={`Opción ${i+1}`}
            className="flex-1 rounded border border-gray-300 p-1.5 text-sm focus:outline-none focus:border-[#802907]" />
          {ops.length > 2 && (
            <button onClick={() => setOps(o => o.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 shrink-0">{Ico.trash}</button>
          )}
        </div>
      ))}
      <p className="text-xs text-gray-400">El radio seleccionado = respuesta correcta</p>
      {ops.length < 5 && (
        <button onClick={() => setOps(o => [...o, { texto: "", es_correcta: false }])}
          className="text-xs rounded border px-2 py-1 text-blue-600 hover:bg-blue-50">+ Agregar opción</button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-gray-50 shadow-2xl overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 shrink-0">
          <div>
            <h3 className="font-bold text-gray-800">Examen — {modulo.nombre}</h3>
            <p className="text-xs text-gray-500">{preguntas.length} pregunta(s) · Pasa con ≥70%</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cargando ? (
            <p className="text-center text-sm text-gray-400 py-6">Cargando...</p>
          ) : (
            <>
              {preguntas.length === 0 && !nueva && (
                <p className="text-center text-sm text-gray-400 py-6">Sin preguntas. Agrega la primera.</p>
              )}

              {preguntas.map((p, idx) => (
                <div key={p.id} className="rounded-lg border bg-white p-4">
                  {editId === p.id ? (
                    <div className="space-y-2">
                      <input value={editTexto} onChange={e => setEditTexto(e.target.value)}
                        className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]" />
                      <EditorOpciones ops={editOps} setOps={setEditOps} setCorrecta={setCorrectaEdit} />
                      <div className="flex gap-2 pt-1">
                        <button onClick={guardarEdicion} className="text-xs rounded bg-[#802907] text-white px-3 py-1 hover:bg-[#5a1b04]">Guardar</button>
                        <button onClick={() => setEditId(null)} className="text-xs rounded border px-3 py-1 text-gray-600 hover:bg-gray-100">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-gray-800">{idx + 1}. {p.texto}</p>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button onClick={() => abrirEditar(p)} className="rounded p-1 text-blue-600 hover:bg-blue-50">{Ico.edit}</button>
                          <button onClick={() => eliminar(p.id)} className="rounded p-1 text-red-600 hover:bg-red-50">{Ico.trash}</button>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-1 pl-2">
                        {p.opciones.map(op => (
                          <li key={op.id} className={`text-xs flex items-center gap-2 ${op.es_correcta ? "text-green-700 font-semibold" : "text-gray-500"}`}>
                            <span className={`h-2 w-2 rounded-full shrink-0 ${op.es_correcta ? "bg-green-500" : "bg-gray-300"}`} />
                            {op.texto}
                            {op.es_correcta && <span className="ml-1 text-[10px] bg-green-100 text-green-700 rounded px-1">Correcta</span>}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}

              {/* Formulario nueva pregunta */}
              {nueva && (
                <div className="rounded-lg border-2 border-dashed border-[#802907] bg-white p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Nueva pregunta</p>
                  <input value={npTexto} onChange={e => setNpTexto(e.target.value)}
                    placeholder="Escribe la pregunta aquí..."
                    className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]" />
                  <EditorOpciones ops={npOps} setOps={setNpOps} setCorrecta={setCorrectaNueva} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={guardarNueva} className="text-xs rounded bg-[#802907] text-white px-3 py-1.5 hover:bg-[#5a1b04]">Guardar pregunta</button>
                    <button onClick={() => { setNueva(false); setNpTexto(""); setNpOps([{ texto:"",es_correcta:true},{texto:"",es_correcta:false}]); }}
                      className="text-xs rounded border px-3 py-1.5 text-gray-600 hover:bg-gray-100">Cancelar</button>
                  </div>
                </div>
              )}

              {!nueva && (
                <button onClick={() => setNueva(true)}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-400 hover:border-[#802907] hover:text-[#802907] transition-colors">
                  + Agregar pregunta
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de módulo ────────────────────────────────────────────────────────
function TarjetaModulo({ modulo, onEditar, onExamen, onEliminar }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow group">
      <div className={`mt-0.5 rounded-lg p-2 shrink-0 ${modulo.file_type === "pdf" ? "bg-red-50 text-red-600" : modulo.file_type === "video" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
        {modulo.file_type === "pdf" ? Ico.file : modulo.file_type === "video" ? Ico.video : Ico.file}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-800 text-sm">{modulo.nombre}</span>
          <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${modulo.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {modulo.estado}
          </span>
          {modulo.preguntas_count > 0 && (
            <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-purple-100 text-purple-700">
              {modulo.preguntas_count} preg.
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{modulo.descripcion}</p>
      </div>
      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEditar(modulo)} title="Editar módulo"
          className="rounded border border-blue-200 bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100">
          {Ico.edit}
        </button>
        <button onClick={() => onExamen(modulo)} title="Gestionar examen"
          className="rounded border border-purple-200 bg-purple-50 p-1.5 text-purple-700 hover:bg-purple-100">
          {Ico.qa}
        </button>
        <button onClick={() => onEliminar(modulo)} title="Eliminar módulo"
          className="rounded border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100">
          {Ico.trash}
        </button>
      </div>
    </div>
  );
}

// ─── Panel de sección activa ──────────────────────────────────────────────────
function PanelSeccion({ seccion, onRefrescar }) {
  const [modalMod, setModalMod]     = useState(null); // {tipo, datos}
  const [examenModulo, setExamen]   = useState(null);
  const [editandoSec, setEditando]  = useState(false);

  const eliminarModulo = async m => {
    const ok = await Swal.fire({
      title: `¿Eliminar "${m.nombre}"?`, icon: "warning",
      text: "Se eliminarán sus preguntas y el progreso de los usuarios.",
      showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await axios.delete(`${API}/api/modulos/${m.id}`);
      onRefrescar();
      Swal.fire({ icon: "success", title: "Módulo eliminado.", confirmButtonColor: "#802907" });
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al eliminar.", confirmButtonColor: "#802907" });
    }
  };

  const alGuardarModulo = () => {
    setModalMod(null);
    onRefrescar();
    Swal.fire({ icon: "success", title: "Módulo guardado.", confirmButtonColor: "#802907" });
  };

  const alGuardarSeccion = () => {
    setEditando(false);
    onRefrescar();
    Swal.fire({ icon: "success", title: "Sección actualizada.", confirmButtonColor: "#802907" });
  };

  return (
    <div className="space-y-4">
      {/* Descripción + botón editar sección */}
      <div className="flex items-center justify-between gap-4">
        {seccion.descripcion && <p className="text-sm text-gray-500">{seccion.descripcion}</p>}
        <button onClick={() => setEditando(true)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 shrink-0 ml-auto">
          {Ico.edit} Editar sección
        </button>
      </div>

      {/* Lista de módulos */}
      <div className="space-y-2">
        {(seccion.modulos || []).length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
            Esta sección no tiene módulos. Agrega el primero.
          </p>
        ) : (
          (seccion.modulos || []).map(m => (
            <TarjetaModulo
              key={m.id}
              modulo={m}
              onEditar={mod => setModalMod({ tipo: "editar", datos: mod })}
              onExamen={mod => setExamen(mod)}
              onEliminar={eliminarModulo}
            />
          ))
        )}
      </div>

      {/* Botón agregar módulo */}
      <button
        onClick={() => setModalMod({ tipo: "crear", datos: null })}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-[#802907] hover:text-[#802907] transition-colors"
      >
        {Ico.plus} Agregar módulo en esta sección
      </button>

      {/* Modales */}
      {modalMod && (
        <ModalModulo
          tipo={modalMod.tipo}
          seccionId={seccion.id}
          datos={modalMod.datos}
          onGuardar={alGuardarModulo}
          onCerrar={() => setModalMod(null)}
        />
      )}
      {editandoSec && (
        <ModalSeccion tipo="editar" datos={seccion} onGuardar={alGuardarSeccion} onCerrar={() => setEditando(false)} />
      )}
      {examenModulo && (
        <PanelExamen modulo={examenModulo} onCerrar={() => { setExamen(null); onRefrescar(); }} />
      )}
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
function Contenido() {
  const storedUser  = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("user") || "null") : null;
  const rol         = storedUser?.puesto?.nombre || null;
  const permisos    = storedUser?.permissions || {};
  const puedeEditar = rol === "SistemasAdmin" || permisos.edit_trainings;

  const [secciones, setSecciones] = useState([]);
  const [abiertos, setAbiertos]   = useState({});   // {seccionId: true/false}
  const [cargando, setCargando]   = useState(true);
  const [modalSec, setModalSec]   = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await axios.get(`${API}/api/secciones`);
      setSecciones(r.data);
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar secciones.", confirmButtonColor: "#802907" });
    } finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggle = id => setAbiertos(prev => ({ ...prev, [id]: !prev[id] }));

  const alCrearSeccion = () => {
    setModalSec(false);
    cargar();
    Swal.fire({ icon: "success", title: "Sección creada.", confirmButtonColor: "#802907" });
  };

  const confirmarEliminarSeccion = async (e, seccion) => {
    e.stopPropagation();
    const ok = await Swal.fire({
      title: `¿Eliminar sección "${seccion.nombre}"?`,
      text: "Solo puedes eliminarla si no tiene módulos.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", cancelButtonColor: "#6b7280",
      confirmButtonText: "Eliminar", cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await axios.delete(`${API}/api/secciones/${seccion.id}`);
      cargar();
      Swal.fire({ icon: "success", title: "Sección eliminada.", confirmButtonColor: "#802907" });
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "No se pudo eliminar.", confirmButtonColor: "#802907" });
    }
  };

  if (!puedeEditar) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
        <p className="text-sm text-gray-500">No tienes permisos para editar el contenido de las capacitaciones.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Editar Contenido de Capacitaciones</h2>
          <p className="text-sm text-gray-500">Organiza el material en secciones y módulos, y configura los exámenes.</p>
        </div>
        <button
          onClick={() => setModalSec(true)}
          className="flex items-center gap-2 rounded-lg bg-[#802907] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04] transition-colors"
        >
          {Ico.plus} Nueva Sección
        </button>
      </div>

      {cargando ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      ) : secciones.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-300">
            {Ico.plus}
          </div>
          <p className="text-lg font-semibold text-gray-600 mb-1">Sin secciones todavía</p>
          <p className="text-sm text-gray-400 mb-5">Crea la primera sección para empezar a organizar los módulos de capacitación.</p>
          <button onClick={() => setModalSec(true)}
            className="rounded-lg bg-[#802907] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5a1b04]">
            Crear primera sección
          </button>
        </div>
      ) : (
        /* Acordeón vertical de secciones */
        <div className="space-y-3">
          {secciones.map(sec => {
            const abierto = !!abiertos[sec.id];
            return (
              <div key={sec.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Cabecera clicable */}
                <button
                  onClick={() => toggle(sec.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Chevron */}
                  <span className={`shrink-0 text-gray-400 transition-transform duration-200 ${abierto ? "rotate-90" : ""}`}>
                    ▶
                  </span>

                  {/* Punto de estado */}
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${sec.estado === "Activo" ? "bg-green-500" : "bg-red-400"}`} />

                  {/* Nombre y contador */}
                  <span className="flex-1 font-semibold text-gray-800">{sec.nombre}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 shrink-0">
                    {sec.modulos?.length || 0} módulo(s)
                  </span>

                  {/* Botón eliminar */}
                  <span
                    role="button"
                    onClick={e => confirmarEliminarSeccion(e, sec)}
                    className="ml-1 rounded-full p-1 text-gray-300 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                    title="Eliminar sección"
                  >
                    {Ico.trash}
                  </span>
                </button>

                {/* Panel expandible */}
                {abierto && (
                  <div className="border-t border-gray-100 p-5">
                    <PanelSeccion
                      key={sec.id}
                      seccion={sec}
                      onRefrescar={cargar}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nueva sección */}
      {modalSec && (
        <ModalSeccion tipo="crear" datos={null} onGuardar={alCrearSeccion} onCerrar={() => setModalSec(false)} />
      )}
    </div>
  );
}

export default Contenido;
