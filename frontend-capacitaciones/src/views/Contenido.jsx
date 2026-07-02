import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// Carga diferida: tldraw es pesado y solo se necesita al crear/editar presentaciones.
const EditorPresentacion = lazy(() =>
  import("../components/PresentacionTldraw").then(m => ({ default: m.EditorPresentacion }))
);

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Íconos ──────────────────────────────────────────────────────────────────
const Ico = {
  plus:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  edit:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.5-6.5a2.121 2.121 0 013 3L12 14H9v-3z"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  qa:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  file:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
  video: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  img:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  back:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
};

// ─── Modal Sección ─────────────────────────────────────────────────────────────
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
    if (!form.nombre || form.nombre.trim().length < 3) v.nombre = "Mínimo 3 caracteres.";
    if (form.nombre.length > 150) v.nombre = "Máximo 150 caracteres.";
    if (Object.keys(v).length) { setErrs(v); return; }
    setSaving(true);
    try {
      if (tipo === "crear") await axios.post(`${API}/api/secciones`, form);
      else await axios.put(`${API}/api/secciones/${datos.id}`, form);
      onGuardar();
    } catch (err) {
      const backErrs = err.response?.data?.errors || {};
      if (backErrs.nombre) setErrs(p => ({ ...p, nombre: backErrs.nombre[0] }));
      else Swal.fire({ icon: "error", title: err.response?.data?.message || "Error al guardar.", confirmButtonColor: "#802907" });
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
              placeholder="Ej: Seguridad Laboral" />
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

// ─── Modal Módulo ──────────────────────────────────────────────────────────────
// contentKind: "archivo" muestra el campo de subida de PDF/Video; "presentacion"
// lo oculta porque ese contenido se diseña aparte en el lienzo de tldraw.
function ModalModulo({ tipo, seccionId, datos, contentKind = "archivo", onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    nombre:      datos?.nombre || "",
    descripcion: datos?.descripcion || "",
    estado:      datos?.estado || "Activo",
    archivo:     null,
    imagen:      null,
  });
  const [preview, setPreview] = useState(datos?.imagen ? `/modulos/${datos.imagen}` : null);
  const [errs, setErrs]       = useState({});
  const [saving, setSaving]   = useState(false);
  const mostrarArchivo = !(tipo === "crear" && contentKind === "presentacion");

  const handle = e => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setForm(p => ({ ...p, [name]: file }));
      if (name === "imagen") {
        const url = URL.createObjectURL(file);
        setPreview(url);
      }
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
    if (errs[name]) setErrs(p => ({ ...p, [name]: null }));
  };

  const submit = async e => {
    e.preventDefault();
    const v = {};
    if (!form.nombre || form.nombre.trim().length < 5) v.nombre = "Mínimo 5 caracteres.";
    if (form.nombre.length > 150) v.nombre = "Máximo 150 caracteres.";
    if (!form.descripcion || form.descripcion.trim().length < 10) v.descripcion = "Mínimo 10 caracteres.";
    if (Object.keys(v).length) { setErrs(v); return; }
    setSaving(true);

    const fd = new FormData();
    fd.append("seccion_id",  seccionId);
    fd.append("nombre",      form.nombre);
    fd.append("descripcion", form.descripcion);
    fd.append("estado",      form.estado);
    if (form.archivo) fd.append("archivo", form.archivo);
    if (form.imagen)  fd.append("imagen", form.imagen);

    try {
      let data;
      if (tipo === "crear") {
        ({ data } = await axios.post(`${API}/api/modulos`, fd));
      } else {
        ({ data } = await axios.post(`${API}/api/modulos/${datos.id}/update`, fd));
      }
      onGuardar(data.modulo);
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
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <h3 className="font-bold text-gray-800">
            {tipo === "crear"
              ? contentKind === "presentacion" ? "Nuevo Módulo — Presentación" : "Nuevo Módulo — Archivo"
              : "Editar Módulo"}
          </h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {tipo === "crear" && contentKind === "presentacion" && (
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs text-purple-700">
              Primero guarda los datos del módulo; después se abrirá el lienzo para diseñar la presentación.
            </div>
          )}
          {/* Imagen portada */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Imagen de portada</label>
            <label className="mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#802907] transition-colors overflow-hidden"
              style={{ minHeight: 140 }}>
              {preview ? (
                <img src={preview} alt="portada" className="w-full h-36 object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                  {Ico.img}
                  <span className="text-xs">Haz clic para subir imagen (JPG, PNG, WEBP · máx. 5 MB)</span>
                </div>
              )}
              <input type="file" name="imagen" accept=".jpg,.jpeg,.png,.webp" onChange={handle} className="hidden" />
            </label>
            {preview && (
              <button type="button" onClick={() => { setPreview(null); setForm(p => ({ ...p, imagen: null })); }}
                className="mt-1 text-xs text-red-500 hover:underline">Quitar imagen</button>
            )}
            {errs.imagen && <p className="text-xs text-red-500 mt-1">{errs.imagen}</p>}
          </div>

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
          <div className={`grid gap-4 ${mostrarArchivo ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <label className="text-sm font-semibold text-gray-700">Estado</label>
              <select name="estado" value={form.estado} onChange={handle}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]">
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            {mostrarArchivo && (
              <div>
                <label className="text-sm font-semibold text-gray-700">Archivo (PDF / MP4)</label>
                <input type="file" name="archivo" accept=".pdf,.mp4,.webm" onChange={handle}
                  className="mt-1 block w-full text-xs text-gray-500 file:rounded file:border-0 file:bg-[#802907] file:px-3 file:py-1.5 file:text-white hover:file:bg-[#5a1b04] cursor-pointer" />
                {tipo === "editar" && datos?.file_path && !form.archivo && (
                  <p className="text-xs text-gray-400 mt-0.5">Actual: <strong>{datos.file_type?.toUpperCase()}</strong></p>
                )}
                {errs.archivo && <p className="text-xs text-red-500 mt-1">{errs.archivo}</p>}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onCerrar} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={saving}
              className="rounded bg-[#802907] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04] disabled:opacity-60">
              {saving ? "Guardando..." : tipo === "crear" ? (contentKind === "presentacion" ? "Crear y abrir lienzo" : "Crear Módulo") : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Editor de opciones (fuera de PanelExamen para evitar pérdida de foco) ────
function EditorOpciones({ ops, setOps, setCorrecta }) {
  return (
    <div className="space-y-2 mt-2">
      {ops.map((op, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            checked={op.es_correcta}
            onChange={() => setCorrecta(i)}
            className="accent-green-600 shrink-0"
            title="Respuesta correcta"
          />
          <input
            value={op.texto}
            onChange={e => {
              const val = e.target.value;
              setOps(o => { const c = [...o]; c[i] = { ...c[i], texto: val }; return c; });
            }}
            placeholder={`Opción ${i + 1}`}
            className="flex-1 rounded border border-gray-300 p-1.5 text-sm focus:outline-none focus:border-[#802907]"
          />
          {ops.length > 2 && (
            <button
              type="button"
              onClick={() => setOps(o => o.filter((_, idx) => idx !== i))}
              className="text-red-400 hover:text-red-600 shrink-0"
            >
              {Ico.trash}
            </button>
          )}
        </div>
      ))}
      <p className="text-xs text-gray-400">El radio seleccionado = respuesta correcta</p>
      {ops.length < 5 && (
        <button
          type="button"
          onClick={() => setOps(o => [...o, { texto: "", es_correcta: false }])}
          className="text-xs rounded border px-2 py-1 text-blue-600 hover:bg-blue-50"
        >
          + Agregar opción
        </button>
      )}
    </div>
  );
}

// ─── Constructor de examen ─────────────────────────────────────────────────────
function PanelExamen({ modulo, onCerrar }) {
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [nueva, setNueva]         = useState(false);
  const [npTexto, setNpTexto]     = useState("");
  const [npOps, setNpOps]         = useState([{ texto: "", es_correcta: true }, { texto: "", es_correcta: false }]);
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
    if (ops.some(o => !o.texto.trim())) { Swal.fire({ icon: "warning", title: "Completa todas las opciones.", confirmButtonColor: "#802907" }); return false; }
    if (!ops.some(o => o.es_correcta)) { Swal.fire({ icon: "warning", title: "Marca una opción como correcta.", confirmButtonColor: "#802907" }); return false; }
    return true;
  };

  const guardarNueva = async () => {
    if (!validarOps(npOps, npTexto)) return;
    try {
      await axios.post(`${API}/api/modulos/${modulo.id}/preguntas`, { texto: npTexto, opciones: npOps });
      setNpTexto(""); setNpOps([{ texto: "", es_correcta: true }, { texto: "", es_correcta: false }]);
      setNueva(false); cargar();
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Error.", confirmButtonColor: "#802907" });
    }
  };

  const guardarEdicion = async () => {
    if (!validarOps(editOps, editTexto)) return;
    try {
      await axios.put(`${API}/api/preguntas/${editId}`, { texto: editTexto, opciones: editOps });
      setEditId(null); cargar();
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Error.", confirmButtonColor: "#802907" });
    }
  };

  const eliminar = async id => {
    const ok = await Swal.fire({ title: "¿Eliminar pregunta?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#6b7280", confirmButtonText: "Sí", cancelButtonText: "Cancelar" });
    if (!ok.isConfirmed) return;
    try { await axios.delete(`${API}/api/preguntas/${id}`); cargar(); }
    catch { Swal.fire({ icon: "error", title: "Error al eliminar.", confirmButtonColor: "#802907" }); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-gray-50 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4 shrink-0">
          <div>
            <h3 className="font-bold text-gray-800">Examen — {modulo.nombre}</h3>
            <p className="text-xs text-gray-500">{preguntas.length} pregunta(s) · Aprueba con ≥70%</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cargando ? <p className="text-center text-sm text-gray-400 py-6">Cargando...</p> : (
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
                          <button onClick={() => { setEditId(p.id); setEditTexto(p.texto); setEditOps(p.opciones.map(o => ({ texto: o.texto, es_correcta: o.es_correcta }))); }}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50">{Ico.edit}</button>
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
              {nueva && (
                <div className="rounded-lg border-2 border-dashed border-[#802907] bg-white p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Nueva pregunta</p>
                  <input value={npTexto} onChange={e => setNpTexto(e.target.value)}
                    placeholder="Escribe la pregunta aquí..."
                    className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:border-[#802907]" />
                  <EditorOpciones ops={npOps} setOps={setNpOps} setCorrecta={setCorrectaNueva} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={guardarNueva} className="text-xs rounded bg-[#802907] text-white px-3 py-1.5 hover:bg-[#5a1b04]">Guardar pregunta</button>
                    <button onClick={() => { setNueva(false); setNpTexto(""); setNpOps([{ texto: "", es_correcta: true }, { texto: "", es_correcta: false }]); }}
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

// ─── Tarjeta de módulo (con imagen) ────────────────────────────────────────────
function TarjetaModulo({ modulo, onEditar, onExamen, onEliminar, onImagenCambiada, onEditarPresentacion }) {
  const inputRef    = useRef(null);
  const [subiendo, setSubiendo] = useState(false);

  const subirImagen = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Resetear el input para que pueda re-seleccionarse el mismo archivo
    e.target.value = "";
    setSubiendo(true);
    const fd = new FormData();
    fd.append("nombre",      modulo.nombre);
    fd.append("descripcion", modulo.descripcion);
    fd.append("estado",      modulo.estado);
    fd.append("imagen",      file);
    try {
      await axios.post(`${API}/api/modulos/${modulo.id}/update`, fd);
      onImagenCambiada();
    } catch (err) {
      const errores = err.response?.data?.errors || {};
      const msg = errores.imagen?.[0]
        || err.response?.data?.message
        || `Error ${err.response?.status || ""} al subir la imagen.`;
      Swal.fire({ icon: "error", title: msg, confirmButtonColor: "#802907" });
    } finally { setSubiendo(false); }
  };

  const imgSrc = modulo.imagen ? `/modulos/${modulo.imagen}` : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      {/* Zona de imagen */}
      <div
        className="relative h-40 bg-gray-100 cursor-pointer overflow-hidden"
        onClick={() => inputRef.current?.click()}
        title="Haz clic para cambiar la imagen"
      >
        {imgSrc ? (
          <img src={imgSrc} alt={modulo.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            {Ico.img}
            <span className="text-xs text-gray-400">Sin imagen</span>
          </div>
        )}
        {/* Overlay al hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="text-white text-xs font-semibold">
            {subiendo ? "Subiendo..." : imgSrc ? "Cambiar imagen" : "Subir imagen"}
          </span>
        </div>
        {/* Badge tipo de contenido */}
        {modulo.file_type && (
          <span className={`absolute top-2 left-2 text-[10px] font-bold rounded px-1.5 py-0.5 ${
            modulo.file_type === "pdf" ? "bg-red-600 text-white"
              : modulo.file_type === "presentacion" ? "bg-purple-600 text-white"
              : "bg-blue-600 text-white"
          }`}>
            {modulo.file_type === "presentacion" ? "PRESENTACIÓN" : modulo.file_type.toUpperCase()}
          </span>
        )}
        {/* Badge estado */}
        <span className={`absolute top-2 right-2 text-[10px] font-bold rounded-full px-2 py-0.5 ${modulo.estado === "Activo" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
          {modulo.estado}
        </span>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={subirImagen} className="hidden" />
      </div>

      {/* Info del módulo */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{modulo.nombre}</h4>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{modulo.descripcion}</p>
        </div>
        {modulo.preguntas_count > 0 && (
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-purple-100 text-purple-700 self-start">
            {modulo.preguntas_count} pregunta(s)
          </span>
        )}

        {/* Acciones */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
          <button onClick={() => onEditar(modulo)} title="Editar módulo"
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
            {Ico.edit} Editar
          </button>
          {modulo.file_type === "presentacion" && (
            <button onClick={() => onEditarPresentacion(modulo)} title="Editar lienzo de la presentación"
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100">
              {Ico.img} Lienzo
            </button>
          )}
          <button onClick={() => onExamen(modulo)} title="Gestionar examen"
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100">
            {Ico.qa} Examen
          </button>
          <button onClick={() => onEliminar(modulo)} title="Eliminar módulo"
            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-red-700 hover:bg-red-100">
            {Ico.trash}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vista: módulos de una sección ─────────────────────────────────────────────
function VistaModulos({ seccion, onVolver, onRefrescar }) {
  const [modalMod, setModalMod]             = useState(null);
  const [examenMod, setExamenMod]           = useState(null);
  const [editSec, setEditSec]               = useState(false);
  const [presentacionMod, setPresentacionMod] = useState(null);

  const eliminarModulo = async m => {
    const ok = await Swal.fire({
      title: `¿Eliminar "${m.nombre}"?`, icon: "warning",
      text: "Se eliminarán sus preguntas y el progreso asociado.",
      showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await axios.delete(`${API}/api/modulos/${m.id}`);
      onRefrescar();
      Swal.fire({ icon: "success", title: "Módulo eliminado.", confirmButtonColor: "#802907" });
    } catch (err) {
      Swal.fire({ icon: "error", title: err.response?.data?.message || "Error.", confirmButtonColor: "#802907" });
    }
  };

  const alGuardar = moduloGuardado => {
    const esNuevaPresentacion = modalMod?.tipo === "crear" && modalMod?.contentKind === "presentacion";
    setModalMod(null);
    onRefrescar();
    if (esNuevaPresentacion && moduloGuardado) {
      setPresentacionMod(moduloGuardado);
    } else {
      Swal.fire({ icon: "success", title: "Módulo guardado.", confirmButtonColor: "#802907" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb + acciones */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={onVolver}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            {Ico.back} Secciones
          </button>
          <span className="text-gray-400">/</span>
          <span className="font-semibold text-gray-800">{seccion.nombre}</span>
          <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${seccion.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {seccion.estado}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditSec(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            {Ico.edit} Editar sección
          </button>
          <button onClick={() => setModalMod({ tipo: "crear", datos: null, contentKind: "archivo" })}
            className="flex items-center gap-2 rounded-lg bg-[#802907] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#5a1b04]">
            {Ico.plus} Subir PDF / Video
          </button>
          <button onClick={() => setModalMod({ tipo: "crear", datos: null, contentKind: "presentacion" })}
            className="flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700 hover:bg-purple-100">
            {Ico.plus} Crear presentación
          </button>
        </div>
      </div>

      {seccion.descripcion && (
        <p className="text-sm text-gray-500">{seccion.descripcion}</p>
      )}

      {/* Grid de tarjetas de módulo */}
      {(seccion.modulos || []).length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-400 text-sm mb-4">Esta sección no tiene módulos todavía.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setModalMod({ tipo: "crear", datos: null, contentKind: "archivo" })}
              className="rounded-lg bg-[#802907] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04]">
              Subir PDF / Video
            </button>
            <button onClick={() => setModalMod({ tipo: "crear", datos: null, contentKind: "presentacion" })}
              className="rounded-lg border border-purple-300 bg-purple-50 px-5 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100">
              Crear presentación
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(seccion.modulos || []).map(m => (
            <TarjetaModulo
              key={m.id}
              modulo={m}
              onEditar={mod => setModalMod({ tipo: "editar", datos: mod, contentKind: "archivo" })}
              onExamen={mod => setExamenMod(mod)}
              onEliminar={eliminarModulo}
              onImagenCambiada={onRefrescar}
              onEditarPresentacion={mod => setPresentacionMod(mod)}
            />
          ))}
        </div>
      )}

      {modalMod && (
        <ModalModulo tipo={modalMod.tipo} seccionId={seccion.id} datos={modalMod.datos} contentKind={modalMod.contentKind}
          onGuardar={alGuardar} onCerrar={() => setModalMod(null)} />
      )}
      {examenMod && (
        <PanelExamen modulo={examenMod} onCerrar={() => { setExamenMod(null); onRefrescar(); }} />
      )}
      {presentacionMod && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <p className="text-sm text-gray-400">Cargando lienzo...</p>
          </div>
        }>
          <EditorPresentacion modulo={presentacionMod} onCerrar={() => { setPresentacionMod(null); onRefrescar(); }}
            onGuardado={() => onRefrescar()} />
        </Suspense>
      )}
      {editSec && (
        <ModalSeccion tipo="editar" datos={seccion}
          onGuardar={() => { setEditSec(false); onRefrescar(); Swal.fire({ icon: "success", title: "Sección actualizada.", confirmButtonColor: "#802907" }); }}
          onCerrar={() => setEditSec(false)} />
      )}
    </div>
  );
}

// ─── Tarjeta de sección ────────────────────────────────────────────────────────
function TarjetaSeccion({ seccion, onClick, onEditar, onEliminar }) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 cursor-pointer hover:border-[#802907] hover:shadow-md transition-all group relative"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${seccion.estado === "Activo" ? "bg-green-500" : "bg-red-400"}`} />
            <h3 className="font-bold text-gray-800 truncate group-hover:text-[#802907] transition-colors">
              {seccion.nombre}
            </h3>
          </div>
          {seccion.descripcion && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{seccion.descripcion}</p>
          )}
          <p className="text-xs text-gray-500 mt-3 font-medium">
            {seccion.modulos?.length || 0} módulo(s)
          </p>
        </div>
        {/* Botones de acción (no propagan el click a la tarjeta) */}
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEditar(seccion)} title="Editar sección"
            className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
            {Ico.edit}
          </button>
          <button onClick={() => onEliminar(seccion)} title="Eliminar sección"
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
            {Ico.trash}
          </button>
        </div>
      </div>

      {/* Flecha indicadora */}
      <div className="absolute bottom-4 right-4 text-gray-200 group-hover:text-[#802907] transition-colors text-lg">
        →
      </div>
    </div>
  );
}

// ─── Vista principal ────────────────────────────────────────────────────────────
function Contenido() {
  const storedUser  = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("user") || "null") : null;
  const rol         = storedUser?.puesto?.nombre || null;
  const permisos    = storedUser?.permissions || {};
  const puedeEditar = rol === "SistemasAdmin" || permisos.edit_trainings;

  const [secciones, setSecciones]  = useState([]);
  const [cargando, setCargando]    = useState(true);
  const [seccionActiva, setActiva] = useState(null);
  const [modalSec, setModalSec]    = useState(null);

  // Carga la lista de secciones sin tocar seccionActiva
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await axios.get(`${API}/api/secciones`);
      setSecciones(r.data);
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar secciones.", confirmButtonColor: "#802907" });
    } finally { setCargando(false); }
  }, []);

  // Recarga y actualiza la sección activa (para cuando se crean/editan módulos)
  const refrescar = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/secciones`);
      setSecciones(r.data);
      setActiva(prev => {
        if (!prev) return null;
        return r.data.find(s => s.id === prev.id) ?? prev;
      });
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar.", confirmButtonColor: "#802907" });
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const confirmarEliminar = async seccion => {
    const ok = await Swal.fire({
      title: `¿Eliminar "${seccion.nombre}"?`,
      text: "Solo puedes eliminarla si no tiene módulos.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", cancelButtonColor: "#6b7280",
      confirmButtonText: "Eliminar", cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await axios.delete(`${API}/api/secciones/${seccion.id}`);
      if (seccionActiva?.id === seccion.id) setActiva(null);
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

  // ── Vista módulos de la sección activa ──
  if (seccionActiva) {
    return (
      <div className="p-6">
        <VistaModulos
          seccion={seccionActiva}
          onVolver={() => setActiva(null)}
          onRefrescar={refrescar}
        />
      </div>
    );
  }

  // ── Vista lista de secciones ──
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Editar Contenido</h2>
          <p className="text-sm text-gray-500">Selecciona una sección para ver y gestionar sus módulos.</p>
        </div>
        <button onClick={() => setModalSec({ tipo: "crear", datos: null })}
          className="flex items-center gap-2 rounded-lg bg-[#802907] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a1b04]">
          {Ico.plus} Nueva Sección
        </button>
      </div>

      {cargando ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      ) : secciones.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-16 text-center">
          <p className="text-lg font-semibold text-gray-600 mb-1">Sin secciones</p>
          <p className="text-sm text-gray-400 mb-5">Crea la primera sección para organizar los módulos.</p>
          <button onClick={() => setModalSec({ tipo: "crear", datos: null })}
            className="rounded-lg bg-[#802907] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5a1b04]">
            Crear primera sección
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {secciones.map(sec => (
            <TarjetaSeccion
              key={sec.id}
              seccion={sec}
              onClick={() => setActiva(sec)}
              onEditar={s => setModalSec({ tipo: "editar", datos: s })}
              onEliminar={confirmarEliminar}
            />
          ))}
        </div>
      )}

      {modalSec && (
        <ModalSeccion
          tipo={modalSec.tipo}
          datos={modalSec.datos}
          onGuardar={() => {
            setModalSec(null);
            cargar();
            Swal.fire({ icon: "success", title: modalSec.tipo === "crear" ? "Sección creada." : "Sección actualizada.", confirmButtonColor: "#802907" });
          }}
          onCerrar={() => setModalSec(null)}
        />
      )}
    </div>
  );
}

export default Contenido;
