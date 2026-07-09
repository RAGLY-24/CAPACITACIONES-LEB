import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";

function Usuarios() {
  // --- ESTADOS PRINCIPALES ---
  const [usuarios, setUsuarios] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [nuevoPuesto, setNuevoPuesto] = useState("");
  const [nuevoSocio, setNuevoSocio] = useState({ nombre: "", telefono: "", correo: "", estado: "Activo" });
  const [socioError, setSocioError] = useState("");
  const [socioModal, setSocioModal] = useState(null);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [errorPuesto, setErrorPuesto] = useState("");
  const [editarPuestoId, setEditarPuestoId] = useState(null);
  const [editarPuestoNombre, setEditarPuestoNombre] = useState("");
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS PARA LOS FILTROS (BÚSQUEDA) ---
  const [filtroUsuarios, setFiltroUsuarios] = useState("");
  const [filtroPuestos, setFiltroPuestos] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // --- Usuario autenticado (desde localStorage) ---
  const storedUser = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('user') || 'null') : null;
  const usuarioLogueado = { id: storedUser?.id || null, rol: storedUser?.puesto?.nombre || null };
  const esAdmin = usuarioLogueado.rol === 'SistemasAdmin';
  const permisosUsuario = storedUser?.permissions || {};
  const puedeCrearUsuarios = esAdmin || permisosUsuario.create_users;
  const puedeEliminarUsuarios = esAdmin || permisosUsuario.delete_users;
  const puedeAsignarPermisos = esAdmin || permisosUsuario.assign_permissions;
  const puedeVerUsuarios = puedeCrearUsuarios || puedeEliminarUsuarios || puedeAsignarPermisos;
  const puedeEditarUsuarios = esAdmin || puedeAsignarPermisos;

  // --- ESTADOS PARA MODALES Y FORMULARIOS ---
  const [modalType, setModalType] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [erroresForm, setErroresForm] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const estadoInicialForm = {
    name: "", lastname: "", email: "", usuario: "",
    password: "", confirmPassword: "", puesto_id: "", socio_id: "", estado: "Activo",
    permissions: {
      create_users: false, delete_users: false, manage_news: false,
      edit_capacitaciones_course: false, manage_passwords: false,
      assign_permissions: false, news_access: true, view_reports: false,
      manage_content: false,
    }
  };
  const [formData, setFormData] = useState(estadoInicialForm);

  useEffect(() => {
    obtenerUsuarios();
    obtenerPuestos();
    obtenerSocios();
  }, []);

  useLockBodyScroll(!!(modalType || socioModal));

  const obtenerUsuarios = async () => {
    try {
      setCargando(true);
      const response = await axios.get(`${API_URL}/api/usuarios`);
      setUsuarios(response.data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const obtenerPuestos = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/puestos`);
      setPuestos(response.data);
    } catch (err) {
      console.error("Error al obtener puestos:", err);
    }
  };

  const obtenerSocios = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/socios`);
      setSocios(response.data);
    } catch (err) {
      console.error("Error al obtener socios:", err);
    }
  };

  // --- CONTROLADORES DE ENTRADA Y DIRTY STATE ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setIsDirty(true);
    if (erroresForm[name]) setErroresForm({ ...erroresForm, [name]: null });
  };

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, permissions: { ...formData.permissions, [name]: checked } });
    setIsDirty(true);
  };

  const handleNuevoPuestoChange = (e) => {
    setNuevoPuesto(e.target.value);
    if (errorPuesto) setErrorPuesto("");
  };

  const handleSocioChange = (e) => {
    const { name, value } = e.target;
    setNuevoSocio({ ...nuevoSocio, [name]: value });
    if (socioError) setSocioError("");
  };

  const crearPuesto = async () => {
    if (!nuevoPuesto.trim()) {
      setErrorPuesto("Ingrese un nombre de puesto.");
      return;
    }
    try {
      await axios.post(`${API_URL}/api/puestos`, { nombre: nuevoPuesto.trim() });
      setNuevoPuesto("");
      obtenerPuestos();
      Swal.fire({ icon: 'success', title: '¡Creado!', text: 'Puesto agregado correctamente.', confirmButtonColor: '#802907' });
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrorPuesto(err.response.data.errors?.nombre?.[0] || "Error al crear el puesto.");
      } else {
        setErrorPuesto("No se pudo crear el puesto. Revise la consola.");
      }
    }
  };

  const crearSocio = async () => {
    if (!nuevoSocio.nombre.trim()) {
      setSocioError("Ingrese un nombre para el socio.");
      return;
    }
    if (!nuevoSocio.telefono.trim()) {
      setSocioError("Ingrese un número de contacto para el socio.");
      return;
    }
    if (!nuevoSocio.correo.trim()) {
      setSocioError("Ingrese un correo para el socio.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/socios`, {
        nombre: nuevoSocio.nombre.trim(),
        telefono: nuevoSocio.telefono.trim(),
        correo: nuevoSocio.correo.trim(),
        estado: nuevoSocio.estado,
      });
      setNuevoSocio({ nombre: "", telefono: "", correo: "", estado: "Activo" });
      setSocioModal(null);
      obtenerSocios();
      Swal.fire({ icon: 'success', title: '¡Socio agregado!', text: 'Se registró correctamente.', confirmButtonColor: '#802907' });
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo crear el socio.';
      setSocioError(message);
    }
  };

  const editarPuesto = (puesto) => {
    setEditarPuestoId(puesto.id);
    setEditarPuestoNombre(puesto.nombre);
    setErrorPuesto("");
  };

  const guardarEdicionPuesto = async () => {
    if (!editarPuestoNombre.trim()) {
      setErrorPuesto("Ingrese un nombre de puesto.");
      return;
    }

    Swal.fire({ title: 'Procesando...', text: 'Actualizando el nombre del puesto.', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
      await axios.put(`${API_URL}/api/puestos/${editarPuestoId}`, { nombre: editarPuestoNombre.trim() });
      setEditarPuestoId(null);
      setEditarPuestoNombre("");
      obtenerPuestos();
      Swal.fire({ icon: 'success', title: '¡Actualizado!', text: 'Puesto actualizado correctamente.', confirmButtonColor: '#802907' });
    } catch (err) {
      Swal.close();
      if (err.response && err.response.status === 422) {
        setErrorPuesto(err.response.data.errors?.nombre?.[0] || "Error al editar el puesto.");
      } else if (err.response && err.response.status === 403) {
        Swal.fire({ icon: 'error', title: 'Acción denegada', text: err.response.data.message || "No tienes permisos.", confirmButtonColor: '#802907' });
      } else {
        Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo contactar con el servidor.', confirmButtonColor: '#802907' });
      }
    }
  };

  const eliminarPuesto = async (id) => {
    const confirmar = window.confirm("¿Eliminar este puesto? Esto puede dejar usuarios sin puesto.");
    if (!confirmar) return;
    try {
      await axios.delete(`${API_URL}/api/puestos/${id}`);
      obtenerPuestos();
      Swal.fire({ icon: 'success', title: '¡Eliminado!', text: 'Puesto eliminado correctamente.', confirmButtonColor: '#802907' });
    } catch (err) {
      if (err.response && err.response.status === 403) {
        alert(err.response.data.message || "Acción denegada.");
      } else {
        alert("No se pudo eliminar el puesto. Revise la consola.");
      }
    }
  };

  // --- VALIDACIONES CON REGEX ---
  const validarFormulario = () => {
    const nuevosErrores = {};
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!formData.name) nuevosErrores.name = "El nombre es obligatorio.";
    if (!formData.email) nuevosErrores.email = "El correo es obligatorio.";
    else if (!regexEmail.test(formData.email)) nuevosErrores.email = "Formato de correo inválido.";
    if (!formData.usuario) nuevosErrores.usuario = "El usuario es obligatorio.";
    if (!formData.puesto_id) nuevosErrores.puesto_id = "Seleccione un puesto.";

    if (modalType === 'crear') {
      if (!formData.password) nuevosErrores.password = "La contraseña es obligatoria (mín. 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial).";
      else if (!regexPassword.test(formData.password)) nuevosErrores.password = "Debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.";
      if (formData.password !== formData.confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden.";
    } else if (modalType === 'editar' && formData.password) {
      if (!regexPassword.test(formData.password)) nuevosErrores.password = "Debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.";
      if (formData.password !== formData.confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden.";
    }

    setErroresForm(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const abrirModalCrear = () => {
    setFormData(estadoInicialForm);
    setErroresForm({});
    setIsDirty(false);
    setPermissionsOpen(false);
    setModalType('crear');
  };

  const abrirModalEditar = (user) => {
    if (!puedeEditarUsuarios) return alert("No tienes permisos para editar usuarios.");
    if (user.puesto?.nombre === 'SistemasAdmin' && !esAdmin) return alert("No tienes permisos para editar a un Administrador.");
    setFormData({ ...user, password: "", confirmPassword: "", socio_id: user.socio_id || "", permissions: { ...estadoInicialForm.permissions, ...user.permissions } });
    setErroresForm({});
    setIsDirty(false);
    setPermissionsOpen(false);
    setModalType('editar');
  };

  const abrirModalEliminar = (user) => {
    if (user.id === usuarioLogueado.id) return alert("Acción denegada: No puedes eliminar tu propia cuenta.");
    setUsuarioSeleccionado(user);
    setModalType('eliminar');
  };

  const abrirModalSocio = () => {
    setNuevoSocio({ nombre: "", telefono: "", correo: "", estado: "Activo" });
    setSocioError("");
    setSocioModal('crear');
  };

  const abrirModalDetalleSocio = (socio) => {
    setSocioSeleccionado(socio);
    setSocioModal('detalle');
  };

  const cerrarModalSocio = () => {
    setSocioModal(null);
    setSocioSeleccionado(null);
    setSocioError("");
  };

  const cerrarModal = () => {
    if (isDirty) {
      Swal.fire({
        title: '¿Tienes cambios sin guardar!',
        text: "¿Estás seguro de que deseas salir y descartar todo?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          setModalType(null);
          setUsuarioSeleccionado(null);
        }
      });
      return;
    }
    setModalType(null);
    setUsuarioSeleccionado(null);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const payload = { ...formData };
    if (!esAdmin && !permisosUsuario.assign_permissions) delete payload.permissions;

    Swal.fire({ title: 'Procesando...', text: 'Guardando la información del usuario', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
      if (modalType === 'crear') {
        await axios.post(`${API_URL}/api/usuarios`, payload);
      } else {
        await axios.put(`${API_URL}/api/usuarios/${formData.id}`, payload);
      }
      obtenerUsuarios();
      obtenerSocios();
      setIsDirty(false);
      setModalType(null);
      Swal.fire({ icon: 'success', title: '¡Éxito!', text: modalType === 'crear' ? 'El usuario fue creado correctamente.' : 'Los cambios fueron guardados.', confirmButtonColor: '#802907' });
    } catch (err) {
      Swal.close();
      if (err.response && err.response.status === 422) {
        const erroresBackend = err.response.data.errors;
        const mapeoErrores = {};
        Object.keys(erroresBackend).forEach(key => { mapeoErrores[key] = erroresBackend[key][0]; });
        setErroresForm(mapeoErrores);
      } else {
        Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'Ocurrió un problema al conectar con la base.', confirmButtonColor: '#802907' });
      }
    }
  };

  const confirmarEliminacion = async () => {
    Swal.fire({ title: 'Eliminando...', text: 'Dando de baja al usuario', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
      await axios.delete(`${API_URL}/api/usuarios/${usuarioSeleccionado.id}`);
      obtenerUsuarios();
      setModalType(null);
      Swal.fire({ icon: 'success', title: '¡Eliminado!', text: 'El usuario ha sido borrado permanentemente.', confirmButtonColor: '#802907' });
    } catch (err) {
      if (err.response && err.response.status === 403) {
        Swal.fire({ icon: 'warning', title: 'Acción Bloqueada', text: err.response.data.message || "No se puede eliminar al último administrador.", confirmButtonColor: '#802907' });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al intentar eliminar este usuario.', confirmButtonColor: '#802907' });
      }
    }
  };

  if (!puedeVerUsuarios) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-red-200">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes los permisos necesarios para ver este directorio.</p>
      </div>
    );
  }

  // --- LÓGICA DE FILTRADO (BUSCADORES) ---
  const usuariosFiltrados = usuarios.filter(
    user =>
      user.name.toLowerCase().includes(filtroUsuarios.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(filtroUsuarios.toLowerCase()) ||
      user.usuario.toLowerCase().includes(filtroUsuarios.toLowerCase()) ||
      (user.puesto?.nombre || "").toLowerCase().includes(filtroUsuarios.toLowerCase())
  );

  const puestosFiltrados = puestos.filter(
    puesto => puesto.nombre.toLowerCase().includes(filtroPuestos.toLowerCase())
  );

  // --- ESTILOS PERSONALIZADOS PARA MATCHEAR TU PÁGINA ---
  const customStyles = {
    tableWrapper: {
      style: {
        borderTop: '1px solid #e5e7eb', // Línea separadora sutil
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f9fafb', // bg-gray-50
        borderBottomWidth: '1px',
        borderBottomColor: '#e5e7eb',
      },
    },
    headCells: {
      style: {
        color: '#374151', // text-gray-700
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
      },
    },
    rows: {
      style: {
        fontSize: '0.875rem', // text-sm
        color: '#4b5563', // text-gray-600
        backgroundColor: '#ffffff',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#e5e7eb',
        },
      },
    },
    pagination: {
      style: {
        borderTopWidth: '1px',
        borderTopColor: '#e5e7eb',
        color: '#6b7280', // text-gray-500
      },
    },
  };

  // --- CONFIGURACIÓN DE COLUMNAS ---
  const columnas = useMemo(() => [
    { name: 'Nombre', selector: row => `${row.name} ${row.lastname}`, sortable: true },
    { name: 'Usuario', selector: row => row.usuario, sortable: true },
    { name: 'Puesto', selector: row => row.puesto?.nombre || "N/A", sortable: true },
    {
      name: 'Acciones',
      minWidth: '180px',
      cell: row => (
        <div className="flex space-x-4">
          <button
            onClick={() => abrirModalEditar(row)}
            disabled={!puedeEditarUsuarios || (row.puesto?.nombre === 'SistemasAdmin' && !esAdmin)}
            className={`font-semibold ${!puedeEditarUsuarios || (row.puesto?.nombre === 'SistemasAdmin' && !esAdmin) ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
          >
            Editar
          </button>
          <button
            onClick={() => abrirModalEliminar(row)}
            disabled={!puedeEliminarUsuarios || row.id === usuarioLogueado.id}
            className={`font-semibold ${!puedeEliminarUsuarios || row.id === usuarioLogueado.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:underline'}`}
          >
            Eliminar
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ], [puedeEditarUsuarios, esAdmin, puedeEliminarUsuarios, usuarioLogueado.id]);

  const columnasPuestos = useMemo(() => [
    {
      name: 'Nombre del Puesto',
      selector: row => row.nombre,
      sortable: true,
      cell: row => {
        if (editarPuestoId === row.id) {
          return (
            <input
              autoFocus
              type="text"
              value={editarPuestoNombre}
              onChange={(e) => setEditarPuestoNombre(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none"
            />
          );
        }
        return <span className="font-medium text-gray-900">{row.nombre}</span>;
      }
    },
    {
      name: 'Acciones',
      minWidth: '180px',
      cell: row => {
        if (editarPuestoId === row.id) {
          return (
            <div className="flex space-x-4">
              <button onClick={guardarEdicionPuesto} className="font-semibold text-green-600 hover:underline">Guardar</button>
              <button onClick={() => { setEditarPuestoId(null); setEditarPuestoNombre(""); setErrorPuesto(""); }} className="font-semibold text-gray-500 hover:underline">Cancelar</button>
            </div>
          );
        }
        return (
          <div className="flex space-x-4">
            <button onClick={() => editarPuesto(row)} className="font-semibold text-blue-600 hover:underline">Editar</button>
            <button onClick={() => eliminarPuesto(row.id)} className="font-semibold text-red-600 hover:underline">Eliminar</button>
          </div>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
    }
  ], [editarPuestoId, editarPuestoNombre, puestos]);

  // --- COMPONENTES DE BÚSQUEDA (El "Search" de DataTables) ---
  const BuscadorUsuarios = useMemo(() => (
    <div className="flex justify-end w-full pb-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-600">Buscar:</label>
        <input
          type="text"
          placeholder="Nombre, usuario o puesto..."
          value={filtroUsuarios}
          onChange={e => setFiltroUsuarios(e.target.value)}
          className="rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none w-64 shadow-sm"
        />
      </div>
    </div>
  ), [filtroUsuarios]);

  const BuscadorPuestos = useMemo(() => (
    <div className="flex justify-end w-full pb-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-600">Buscar Puesto:</label>
        <input
          type="text"
          placeholder="Buscar..."
          value={filtroPuestos}
          onChange={e => setFiltroPuestos(e.target.value)}
          className="rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none w-56 shadow-sm"
        />
      </div>
    </div>
  ), [filtroPuestos]);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm relative">

      {/* CABECERA USUARIOS */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Directorio de Usuarios</h2>
        </div>
        {puedeCrearUsuarios && (
          <button onClick={abrirModalCrear} className="rounded-md bg-[#802907] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4e1802] shadow-sm">
            + Crear Nuevo Usuario
          </button>
        )}
      </div>

      {/* TABLA USUARIOS CON ESTILO DATATABLES */}
      <div className="rounded-lg border border-gray-200 p-4 bg-white">
        <DataTable
          columns={columnas}
          data={usuariosFiltrados} // <-- Pasamos el arreglo filtrado
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]} // Opciones clásicas de DataTables
          highlightOnHover
          responsive
          customStyles={customStyles} // <-- Aplica los estilos de Tailwind
          subHeader
          subHeaderComponent={BuscadorUsuarios} // <-- Inserta el input de búsqueda arriba a la derecha
          noDataComponent={<div className="p-8 text-gray-500 text-center">No se encontraron usuarios.</div>}
          progressPending={cargando}
          progressComponent={<div className="p-8 text-gray-600 font-semibold text-center">Cargando directorio...</div>}
        />
      </div>

      {/* MODAL USUARIOS */}
      {(modalType === 'crear' || modalType === 'editar') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">
              {modalType === 'crear' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
            </h2>
            <form onSubmit={guardarUsuario} className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                {erroresForm.name && <p className="mt-1 text-xs text-red-500">{erroresForm.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Apellido</label>
                <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Correo Electrónico <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                {erroresForm.email && <p className="mt-1 text-xs text-red-500">{erroresForm.email}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Usuario de acceso <span className="text-red-500">*</span></label>
                <input type="text" name="usuario" value={formData.usuario} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                {erroresForm.usuario && <p className="mt-1 text-xs text-red-500">{erroresForm.usuario}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Puesto <span className="text-red-500">*</span></label>
                <select name="puesto_id" value={formData.puesto_id} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none">
                  <option value="">Seleccione un puesto</option>
                  {puestos.map((puesto) => (
                    <option key={puesto.id} value={puesto.id}>{puesto.nombre}</option>
                  ))}
                </select>
                {erroresForm.puesto_id && <p className="mt-1 text-xs text-red-500">{erroresForm.puesto_id}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Estado</label>
                <select name="estado" value={formData.estado} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Socio / Empresa</label>
                <select name="socio_id" value={formData.socio_id || ""} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none">
                  <option value="">Sin asociación</option>
                  {socios.map((socio) => (
                    <option key={socio.id} value={socio.id}>{socio.nombre} {socio.empresa ? `- ${socio.empresa}` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-6 rounded-md bg-gray-50 p-4 border border-gray-200">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Contraseña {modalType === 'crear' && <span className="text-red-500">*</span>}
                  </label>
                  <input type="password" name="password" placeholder={modalType === 'editar' ? "Dejar en blanco para conservar" : ""} value={formData.password} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                  {erroresForm.password && <p className="mt-1 text-xs text-red-500">{erroresForm.password}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Repetir Contraseña</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                  {erroresForm.confirmPassword && <p className="mt-1 text-xs text-red-500">{erroresForm.confirmPassword}</p>}
                </div>
              </div>

              {puedeAsignarPermisos && (
                <div className="col-span-2 rounded-md bg-white p-4 border border-gray-200">
                  <button type="button" onClick={() => setPermissionsOpen(!permissionsOpen)} className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-800">
                    <span>Permisos del usuario</span>
                    <span className="text-xs text-gray-500">{permissionsOpen ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
                  {permissionsOpen && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        { key: 'create_users', label: 'Crear usuarios' }, { key: 'delete_users', label: 'Eliminar usuarios' },
                        { key: 'manage_news', label: 'Publicar noticias' }, { key: 'news_access', label: 'Acceso a noticias' },
                        { key: 'edit_capacitaciones_course', label: 'Editar capacitaciones' }, { key: 'manage_passwords', label: 'Administrar contraseñas' },
                        { key: 'assign_permissions', label: 'Asignar permisos' }, { key: 'view_reports', label: 'Ver reportes' },
                        { key: 'manage_content', label: 'Gestionar contenido' },
                      ].map(permission => (
                        <label key={permission.key} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            name={permission.key}
                            checked={formData.permissions?.[permission.key] || false}
                            onChange={handlePermissionChange}
                            className="h-4 w-4 rounded border-gray-300 text-[#802907] focus:ring-[#802907]"
                          />
                          {permission.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="col-span-2 mt-4 flex justify-end gap-4">
                <button type="button" onClick={cerrarModal} className="rounded-md px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
                <button type="submit" disabled={!isDirty} className={`rounded-md px-6 py-2 font-semibold text-white shadow-sm ${!isDirty ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#802907] hover:bg-[#4e1802]'}`}>Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECCIÓN DE SOCIOS */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Directorio de Socios</h3>
            <p className="text-sm text-gray-500">Asocia a un operador con su socio y revisa los usuarios vinculados.</p>
          </div>
          <button onClick={abrirModalSocio} className="rounded-md bg-[#802907] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4e1802] shadow-sm whitespace-nowrap">
            + Agregar socio
          </button>
        </div>

        {socioError && <p className="mt-2 text-xs text-red-500">{socioError}</p>}
        <div className="mt-4 rounded-lg border border-gray-200 p-4 bg-white">
          <div className="grid gap-2 text-sm text-gray-700">
            {socios.length === 0 ? (
              <p className="text-gray-500">No hay socios registrados.</p>
            ) : socios.map((socio) => (
              <button
                key={socio.id}
                type="button"
                onClick={() => abrirModalDetalleSocio(socio)}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-3 text-left transition hover:border-[#802907] hover:bg-[#fdf7f3]"
              >
                <div>
                  <p className="font-semibold text-gray-800">{socio.nombre}</p>
                  <p className="text-xs text-gray-500">{socio.telefono || 'Sin teléfono'} · {socio.correo || 'Sin correo'} · {socio.estado}</p>
                </div>
                <span className="text-xs font-semibold text-gray-600">{socio.usuarios_count ?? socio.usuarios?.length ?? 0} asignado(s)</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE PUESTOS */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Directorio de Puestos</h3>
            <p className="text-sm text-gray-500">Los puestos creados aquí no tendrán permisos de SistemasAdmin.</p>
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <div className="flex-grow">
              <input
                type="text"
                value={nuevoPuesto}
                onChange={handleNuevoPuestoChange}
                placeholder="Nombre del nuevo puesto"
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none shadow-sm"
              />
              {errorPuesto && <p className="mt-1 text-xs text-red-500">{errorPuesto}</p>}
            </div>
            <button onClick={crearPuesto} className="rounded-md bg-[#802907] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4e1802] shadow-sm whitespace-nowrap">
              + Agregar
            </button>
          </div>
        </div>

        {/* TABLA PUESTOS CON ESTILO DATATABLES */}
        <div className="rounded-lg border border-gray-200 p-4 bg-white">
          <DataTable
            columns={columnasPuestos}
            data={puestosFiltrados} // <-- Pasamos el arreglo filtrado
            pagination
            paginationPerPage={5}
            paginationRowsPerPageOptions={[5, 10, 20]}
            highlightOnHover
            responsive
            customStyles={customStyles} // <-- Aplica los estilos de Tailwind
            subHeader
            subHeaderComponent={BuscadorPuestos} // <-- Inserta el input de búsqueda arriba a la derecha
            noDataComponent={<div className="p-8 text-gray-500 text-center">No hay puestos registrados en el sistema.</div>}
          />
        </div>
      </div>

      {socioModal === 'crear' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800">Agregar nuevo socio</h3>
            <p className="mt-1 text-sm text-gray-500">Completa estos datos para registrar el socio.</p>
            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre <span className="text-red-500">*</span></label>
                <input type="text" name="nombre" value={nuevoSocio.nombre} onChange={handleSocioChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Número <span className="text-red-500">*</span></label>
                <input type="text" name="telefono" value={nuevoSocio.telefono} onChange={handleSocioChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Correo <span className="text-red-500">*</span></label>
                <input type="email" name="correo" value={nuevoSocio.correo} onChange={handleSocioChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Estado</label>
                <select name="estado" value={nuevoSocio.estado} onChange={handleSocioChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={cerrarModalSocio} className="rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button type="button" onClick={crearSocio} className="rounded-md bg-[#802907] px-5 py-2 font-semibold text-white hover:bg-[#4e1802]">Guardar socio</button>
            </div>
          </div>
        </div>
      )}

      {socioModal === 'detalle' && socioSeleccionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{socioSeleccionado.nombre}</h3>
                <p className="text-sm text-gray-500">{socioSeleccionado.telefono || 'Sin teléfono'} · {socioSeleccionado.correo || 'Sin correo'}</p>
              </div>
              <button type="button" onClick={cerrarModalSocio} className="text-sm font-semibold text-gray-500 hover:text-gray-700">Cerrar</button>
            </div>
            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">Operadores asignados</p>
              <p className="text-xs text-gray-500">{socioSeleccionado.usuarios_count ?? socioSeleccionado.usuarios?.length ?? 0} registrado(s)</p>
              <div className="mt-3 space-y-2">
                {(socioSeleccionado.usuarios || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No hay operadores asignados todavía.</p>
                ) : socioSeleccionado.usuarios.map((usuario) => (
                  <div key={usuario.id} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                    <p className="text-sm font-semibold text-gray-800">{usuario.name} {usuario.lastname}</p>
                    <p className="text-xs text-gray-500">{usuario.puesto?.nombre || 'Sin puesto'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalType === 'eliminar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar a {usuarioSeleccionado?.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción borrará permanentemente la cuenta y no se puede deshacer.</p>
            <div className="flex justify-center gap-4">
              <button onClick={cerrarModal} className="rounded-md border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmarEliminacion} className="rounded-md bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700 shadow-sm">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;