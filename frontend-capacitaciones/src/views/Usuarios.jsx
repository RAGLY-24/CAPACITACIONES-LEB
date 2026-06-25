import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

function Usuarios() {
  // --- ESTADOS PRINCIPALES ---
  const [usuarios, setUsuarios] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [nuevoPuesto, setNuevoPuesto] = useState("");
  const [errorPuesto, setErrorPuesto] = useState("");
  const [editarPuestoId, setEditarPuestoId] = useState(null);
  const [editarPuestoNombre, setEditarPuestoNombre] = useState("");
  const [cargando, setCargando] = useState(true);

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
  const [modalType, setModalType] = useState(null); // 'crear', 'editar', 'eliminar', o null
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [erroresForm, setErroresForm] = useState({});
  const [isDirty, setIsDirty] = useState(false); // Control de cambios sin guardar

  // Estado inicial vacío para el formulario
  const estadoInicialForm = {
    name: "", lastname: "", email: "", usuario: "",
    password: "", confirmPassword: "", puesto_id: "", estado: "Activo",
    permissions: {
      create_users: false,
      delete_users: false,
      manage_news: false,
      edit_capacitaciones_course: false,
      manage_passwords: false,
      assign_permissions: false,
      news_access: true,
    }
  };
  const [formData, setFormData] = useState(estadoInicialForm);

  useEffect(() => {
    obtenerUsuarios();
    obtenerPuestos();
  }, []);

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

  // --- CONTROLADORES DE ENTRADA Y DIRTY STATE ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setIsDirty(true); // El usuario ya modificó algo

    // Limpiar error específico si el usuario empieza a escribir
    if (erroresForm[name]) {
      setErroresForm({ ...erroresForm, [name]: null });
    }
  };

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [name]: checked,
      }
    });
    setIsDirty(true);
  };

  const handleNuevoPuestoChange = (e) => {
    setNuevoPuesto(e.target.value);
    if (errorPuesto) {
      setErrorPuesto("");
    }
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
      alert("Puesto agregado correctamente.");
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrorPuesto(err.response.data.errors?.nombre?.[0] || "Error al crear el puesto.");
      } else {
        console.error(err);
        setErrorPuesto("No se pudo crear el puesto. Revise la consola.");
      }
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

    // 1. Mostrar pantalla de carga
    Swal.fire({
      title: 'Procesando...',
      text: 'Actualizando el nombre del puesto.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await axios.put(`${API_URL}/api/puestos/${editarPuestoId}`, { nombre: editarPuestoNombre.trim() });

      // Limpiar estados y recargar la lista
      setEditarPuestoId(null);
      setEditarPuestoNombre("");
      obtenerPuestos();

      // 2. Mostrar pantalla de éxito al terminar
      Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'Puesto actualizado correctamente.',
        confirmButtonColor: '#802907'
      });

    } catch (err) {
      // 3. Cerrar la alerta de carga si algo sale mal
      Swal.close();

      // Logica de errores
      if (err.response && err.response.status === 422) {
        setErrorPuesto(err.response.data.errors?.nombre?.[0] || "Error al editar el puesto.");
      } else if (err.response && err.response.status === 403) {
        setErrorPuesto(err.response.data.message || "Acción denegada.");
        // Error de permisos
        Swal.fire({
          icon: 'error',
          title: 'Acción denegada',
          text: err.response.data.message || "No tienes permisos para esta acción.",
          confirmButtonColor: '#802907'
        });
      } else {
        console.error(err);
        setErrorPuesto("No se pudo editar el puesto. Revise la consola.");
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo contactar con el servidor.',
          confirmButtonColor: '#802907'
        });
      }
    }
  };

  const eliminarPuesto = async (id) => {
    const confirmar = window.confirm("¿Eliminar este puesto? Esto puede dejar usuarios sin puesto.");
    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/api/puestos/${id}`);
      obtenerPuestos();
      alert("Puesto eliminado correctamente.");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        alert(err.response.data.message || "Acción denegada.");
      } else {
        console.error(err);
        alert("No se pudo eliminar el puesto. Revise la consola.");
      }
    }
  };

  // --- VALIDACIONES CON REGEX ---
  const validarFormulario = () => {
    const nuevosErrores = {};
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Regex Password: Min 8 chars, 1 Mayúscula, 1 Minúscula, 1 Número, 1 Especial
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!formData.name) nuevosErrores.name = "El nombre es obligatorio.";
    if (!formData.email) nuevosErrores.email = "El correo es obligatorio.";
    else if (!regexEmail.test(formData.email)) nuevosErrores.email = "Formato de correo inválido.";
    if (!formData.usuario) nuevosErrores.usuario = "El usuario es obligatorio.";
    if (!formData.puesto_id) nuevosErrores.puesto_id = "Seleccione un puesto.";

    // Validaciones de Contraseña (Diferente si es Crear o Editar)
    if (modalType === 'crear') {
      if (!formData.password) nuevosErrores.password = "La contraseña es obligatoria y debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.";
      else if (!regexPassword.test(formData.password)) nuevosErrores.password = "Debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.";

      if (formData.password !== formData.confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden.";
    } else if (modalType === 'editar' && formData.password) {
      if (!regexPassword.test(formData.password)) nuevosErrores.password = "Debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.";
      if (formData.password !== formData.confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden.";
    }

    setErroresForm(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // --- ACCIONES DE MODALES ---
  const abrirModalCrear = () => {
    setFormData(estadoInicialForm);
    setErroresForm({});
    setIsDirty(false);
    setModalType('crear');
  };

  const abrirModalEditar = (user) => {
    if (!puedeEditarUsuarios) {
      alert("No tienes permisos para editar usuarios.");
      return;
    }

    if (user.puesto?.nombre === 'SistemasAdmin' && !esAdmin) {
      alert("No tienes permisos para editar a un Administrador del sistema.");
      return;
    }
    setFormData({
      ...user,
      password: "",
      confirmPassword: "",
      permissions: {
        ...estadoInicialForm.permissions,
        ...user.permissions,
      },
    });
    setErroresForm({});
    setIsDirty(false);
    setModalType('editar');
  };

  const abrirModalEliminar = (user) => {
    if (user.id === usuarioLogueado.id) {
      alert("Acción denegada: No puedes eliminar tu propia cuenta por motivos de seguridad.");
      return;
    }
    setUsuarioSeleccionado(user);
    setModalType('eliminar');
  };

  /*   const cerrarModal = () => {
      if (isDirty) {
        const confirmar = window.confirm("Tienes cambios sin guardar. ¿Deseas salir y descartarlos?");
        if (!confirmar) return;
      }
      setModalType(null);
      setUsuarioSeleccionado(null);
    }; */
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

  // --- ENVÍO DE DATOS (SUBMIT) ---
  /* const guardarUsuario = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      if (modalType === 'crear') {
        await axios.post("http://localhost:8000/api/usuarios", formData);
      } else {
        await axios.put(`http://localhost:8000/api/usuarios/${formData.id}`, formData);
      }

      obtenerUsuarios();
      setIsDirty(false);
      setModalType(null);
      alert("¡Usuario guardado con éxito!");

    } catch (err) {
      if (err.response && err.response.status === 422) {
        const erroresBackend = err.response.data.errors;
        const mapeoErrores = {};

        Object.keys(erroresBackend).forEach(key => {
          mapeoErrores[key] = erroresBackend[key][0];
        });

        setErroresForm(mapeoErrores);
      } else {
        console.error("Error completo:", err);
        alert("Ocurrió un error inesperado al conectar con el servidor. Revisa la consola (F12).");
      }
    }
  }; */
  // --- ENVÍO DE DATOS (SUBMIT) ---
  const guardarUsuario = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const payload = { ...formData };
    if (!esAdmin && !permisosUsuario.assign_permissions) {
      delete payload.permissions;
    }

    Swal.fire({
      title: 'Procesando...',
      text: 'Guardando la información del usuario',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      if (modalType === 'crear') {
        await axios.post(`${API_URL}/api/usuarios`, payload);
      } else {
        await axios.put(`${API_URL}/api/usuarios/${formData.id}`, payload);
      }

      obtenerUsuarios(); // Recargar tabla
      setIsDirty(false); // Limpiar estado sucio
      setModalType(null); // Cerrar modal de React

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: modalType === 'crear' ? 'El usuario fue creado correctamente.' : 'Los cambios fueron guardados.',
        confirmButtonColor: '#802907'
      });

    } catch (err) {
      Swal.close();

      if (err.response && err.response.status === 422) {
        const erroresBackend = err.response.data.errors;
        const mapeoErrores = {};

        Object.keys(erroresBackend).forEach(key => {
          mapeoErrores[key] = erroresBackend[key][0];
        });

        setErroresForm(mapeoErrores);
      } else {
        console.error("Error completo:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error del servidor',
          text: 'Ocurrió un problema al conectar con la base de datos.',
          confirmButtonColor: '#802907'
        });
      }
    }
  };

  // const confirmarEliminacion = async () => {
  //   try {
  //     await axios.delete(`http://localhost:8000/api/usuarios/${usuarioSeleccionado.id}`);
  //     obtenerUsuarios();
  //     setModalType(null);
  //   } catch (err) {
  //     if (err.response && err.response.status === 403) {
  //       alert(err.response.data.message || "No se puede eliminar al último administrador.");
  //     } else {
  //       alert("Error al eliminar el usuario.");
  //     }
  //   }
  // };

  const confirmarEliminacion = async () => {
    // 1. Mostrar pantalla de eliminando
    Swal.fire({
      title: 'Eliminando...',
      text: 'Dando de baja al usuario',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await axios.delete(`${API_URL}/api/usuarios/${usuarioSeleccionado.id}`);
      obtenerUsuarios();
      setModalType(null); // Cierra tu modal de eliminación de React

      // 2. Pantalla de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'El usuario ha sido borrado permanentemente.',
        confirmButtonColor: '#802907'
      });

    } catch (err) {
      if (err.response && err.response.status === 403) {
        Swal.fire({
          icon: 'warning',
          title: 'Acción Bloqueada',
          text: err.response.data.message || "No se puede eliminar al último administrador.",
          confirmButtonColor: '#802907'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al intentar eliminar este usuario.',
          confirmButtonColor: '#802907'
        });
      }
    }
  };

  // NUEVA PROTECCIÓN: Echar al intruso
  if (!puedeVerUsuarios) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-red-200">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes los permisos necesarios para ver este directorio.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm relative">

      {/* CABECERA */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Directorio de Usuarios</h2>
        </div>
        {puedeCrearUsuarios && (
          <button
            onClick={abrirModalCrear}
            className="rounded-md bg-[#802907] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4e1802]"
          >
            + Crear Nuevo Usuario
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Puesto</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {usuarios.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{user.name} {user.lastname}</td>
                <td className="px-6 py-4">{user.usuario}</td>
                <td className="px-6 py-4 text-blue-600 font-medium">{user.puesto?.nombre || "N/A"}</td>
                <td className="px-6 py-4 text-center space-x-4">
                  <button
                    onClick={() => abrirModalEditar(user)}
                    disabled={!puedeEditarUsuarios || (user.puesto?.nombre === 'SistemasAdmin' && !esAdmin)}
                    className={`font-semibold ${!puedeEditarUsuarios || (user.puesto?.nombre === 'SistemasAdmin' && !esAdmin) ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => abrirModalEliminar(user)}
                    disabled={!puedeEliminarUsuarios || user.id === usuarioLogueado.id}
                    className={`font-semibold ${!puedeEliminarUsuarios || user.id === usuarioLogueado.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:underline'}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: CREAR / EDITAR USUARIO */}
      {(modalType === 'crear' || modalType === 'editar') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
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
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Permisos del usuario</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: 'create_users', label: 'Crear usuarios' },
                      { key: 'delete_users', label: 'Eliminar usuarios' },
                      { key: 'manage_news', label: 'Publicar noticias' },
                      { key: 'news_access', label: 'Acceso a noticias' },
                      { key: 'edit_capacitaciones_course', label: 'Editar capacitaciones' },
                      { key: 'manage_passwords', label: 'Administrar contraseñas' },
                      { key: 'assign_permissions', label: 'Asignar permisos' },
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
                </div>
              )}

              <div className="col-span-2 mt-4 flex justify-end gap-4">
                <button type="button" onClick={cerrarModal} className="rounded-md px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100">
                  Cancelar
                </button>
                <button type="submit" disabled={!isDirty} className={`rounded-md px-6 py-2 font-semibold text-white ${!isDirty ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#802907] hover:bg-[#4e1802]'}`}>
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Agregar puesto</h3>
            <p className="text-sm text-gray-500">Los puestos creados aquí no tendrán permisos de SistemasAdmin.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <input
              type="text"
              value={nuevoPuesto}
              onChange={handleNuevoPuestoChange}
              placeholder="Nombre del puesto"
              className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none"
            />
            {errorPuesto && <p className="mt-1 text-xs text-red-500">{errorPuesto}</p>}
          </div>
          <button onClick={crearPuesto} className="rounded-md bg-[#802907] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4e1802]">
            Guardar puesto
          </button>
        </div>
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Puestos existentes</h4>
          <ul className="space-y-2">
            {puestos.map((puesto) => (
              <li key={puesto.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3 bg-white">
                <div className="flex items-center gap-4">
                  {editarPuestoId === puesto.id ? (
                    <input value={editarPuestoNombre} onChange={(e) => setEditarPuestoNombre(e.target.value)} className="rounded-md border border-gray-300 p-1" />
                  ) : (
                    <span className="font-medium text-gray-800">{puesto.nombre}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editarPuestoId === puesto.id ? (
                    <>
                      <button onClick={guardarEdicionPuesto} className="rounded-md bg-green-600 px-3 py-1 text-white text-sm">Guardar</button>
                      <button onClick={() => { setEditarPuestoId(null); setEditarPuestoNombre(""); setErrorPuesto(""); }} className="rounded-md border px-3 py-1 text-sm">Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => editarPuesto(puesto)} className="rounded-md border px-3 py-1 text-sm">Editar</button>
                      <button onClick={() => eliminarPuesto(puesto.id)} className="rounded-md border px-3 py-1 text-sm text-red-600">Eliminar</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* MODAL: ELIMINAR USUARIO */}
      {modalType === 'eliminar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Estás seguro de que deseas eliminar a {usuarioSeleccionado?.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción borrará permanentemente la cuenta y no se puede deshacer.</p>

            <div className="flex justify-center gap-4">
              <button onClick={cerrarModal} className="rounded-md border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={confirmarEliminacion} className="rounded-md bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;