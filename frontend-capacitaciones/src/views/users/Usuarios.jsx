import { useState, useMemo, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import { useSearchParams } from "react-router-dom";
import { Check, Link, Pencil, ShieldCheck, PlusIcon, Trash2, X } from "lucide-react";

import { URL } from "../../api/http.client";

import { useUsers } from "../../hooks/users/useUsers";
import { useUpdateUser } from "../../hooks/users/useUpdateUser";
import { useCreateUser } from "../../hooks/users/useCreateUser";
import { useDeleteUser } from "../../hooks/users/useDeleteUser";

import { usePartners } from "../../hooks/partners/usePartners";
import { useUpdatePartner } from "../../hooks/partners/useUpdatePartner";
import { useCreatePartner } from "../../hooks/partners/useCreatePartner";
import { useDeletePartner } from "../../hooks/partners/useDeletePartner";

import { usePositions } from "../../hooks/position/usePositions";
import { useUpdatePosition } from "../../hooks/position/useUpdatePosition";
import { useCreatePosition } from "../../hooks/position/useCreatePosition";
import { useDeletePosition } from "../../hooks/position/useDeletePosition";

import UsersFormModal from "./users/modals/UsersFormModal";
import UserDeleteModal from "./users/modals/UserDeleteModal";

import PartnerFormModal from "./socios/PartnerFormModal";
import PartnerDeleteModal from "./socios/PartnerDeleteModal";
import PartnerViewModal from "./socios/PartnerViewModal";

import PositionDeleteModal from "./puestos/PositionDeleteModal";
import PositionPermissionsModal from "./puestos/PositionPermissionsModal";
import { useMe } from "../../hooks/auth/useMe";
import { IconButton } from "../../components/IconButton";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Fields/Input";

function Usuarios() {

  const [searchParams, setSearchParams] = useSearchParams();

  const action = searchParams.get("action");
  const actionId = searchParams.get("id");
  const actionType = searchParams.get("type");


  const isEdit = action === "edit";
  const isDelete = action === "delete";
  const isCreate = action === "create";
  const isView = action === "view";
  const isPermisos = action === "permisos";


  const shouldOpenUserModal = actionType == "user"
  const shouldOpenPartnerModal = actionType == "partner"
  const shouldOpenPositionModal = actionType == "position"


  const { data: usuarios, isLoading: usersIsLoading } = useUsers()
  const { mutateAsync: updateUser } = useUpdateUser()
  const { mutateAsync: createUser } = useCreateUser()
  const { mutateAsync: deleteUser } = useDeleteUser()

  const { data: socios, refetch: refetchPartners } = usePartners();
  const { mutateAsync: updatePartner } = useUpdatePartner()
  const { mutateAsync: createPartner } = useCreatePartner()
  const { mutateAsync: deletePartner } = useDeletePartner()


  const { data: puestos } = usePositions();
  const { mutateAsync: updatePosition } = useUpdatePosition()
  const { mutateAsync: createPosition } = useCreatePosition()
  const { mutateAsync: deletePosition } = useDeletePosition()

  // --- ESTADOS PRINCIPALES ---
  //const [usuarios, setUsuarios] = useState([]);
  //const [socios, setSocios] = useState([]);
  const [nuevoPuesto, setNuevoPuesto] = useState("");
  const [errorPuesto, setErrorPuesto] = useState("");
  const [editarPuestoId, setEditarPuestoId] = useState(null);
  const [editarPuestoNombre, setEditarPuestoNombre] = useState("");

  // --- ESTADOS PARA LOS FILTROS (BÚSQUEDA) ---
  const [filtroUsuarios, setFiltroUsuarios] = useState("");
  const [filtroPuestos, setFiltroPuestos] = useState("");

  const API_URL = URL

  // --- Usuario autenticado  ---
  const { data } = useMe();

  const storedUser = typeof window !== 'undefined' ? data : null;

  const usuarioLogueado = { id: storedUser?.id || null, rol: storedUser?.puesto?.nombre || null };

  const esAdmin = usuarioLogueado.rol === 'SistemasAdmin';

  const permisosUsuario = storedUser?.permissions || {};
  const puedeCrearUsuarios = esAdmin || permisosUsuario.create_users;
  const puedeEliminarUsuarios = esAdmin || permisosUsuario.delete_users;
  const puedeAsignarPermisos = esAdmin || permisosUsuario.assign_permissions;
  const puedeVerUsuarios = puedeCrearUsuarios || puedeEliminarUsuarios || puedeAsignarPermisos;
  const puedeEditarUsuarios = esAdmin || puedeAsignarPermisos;

  const handleNuevoPuestoChange = (e) => {
    setNuevoPuesto(e.target.value);
    if (errorPuesto) setErrorPuesto("");
  };


  const handleSaveChanges = useCallback(async (d) => {
    console.log(d)

    const { type, mode, payload } = d

    const mensajes = {
      user: {
        create: "El usuario fue creado correctamente.",
        edit: "Los cambios del usuario fueron guardados correctamente.",
        delete: "El usuario se eliminó correctamente",
      },
      position: {
        create: "El puesto fue creado correctamente.",
        edit: "Los cambios del puesto fueron guardados correctamente.",
        delete: "El puesto se eliminó correctamente",
      },
      partner: {
        create: "El socio fue creado correctamente.",
        edit: "Los cambios del socio fueron guardados correctamente.",
        delete: "El socio se eliminó correctamente",
      },
    };

    Swal.fire({ title: 'Procesando...', text: 'Guardando la información', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    let isValidAction = false
    try {

      if (type == "user") {
        if (mode == "create") {
          isValidAction = true
          await createUser(payload)
        } else if (mode == "edit") {
          isValidAction = true
          await updateUser({ id: payload.id, data: payload })
        }
        else if (mode == "delete") {
          isValidAction = true
          await deleteUser(payload.id)
        }
        refetchPartners()
      }

      else if (type == "position") {
        if (mode == "create") {
          isValidAction = true
          await createPosition(payload)
        } else if (mode == "edit") {
          isValidAction = true
          await updatePosition({ id: payload.id, data: { nombre: payload.nombre, default_permissions: payload.default_permissions } })
        }
        else if (mode == "delete") {
          isValidAction = true
          await deletePosition(payload.id)
        }
      }


      else if (type == "partner") {
        if (mode == "create") {
          isValidAction = true
          await createPartner(payload)
        } else if (mode == "edit") {
          isValidAction = true
          await updatePartner({ id: payload.id, data: payload })
        }
        else if (mode == "delete") {
          isValidAction = true
          await deletePartner(payload.id)
        }
      }

      if (isValidAction) {
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: mensajes[type]?.[mode] ?? "Operación realizada correctamente.",
          confirmButtonColor: "#802907",
        });
      } else {
        Swal.close();
      }
      setSearchParams({})
    } catch (error) {
      let title = "Error del servidor";
      let text = "Ocurrió un problema al enviar la información";
      let icon = "error";

      if (error.response?.status === 403) {
        title = "Acceso denegado";
        text = "No tienes permisos para realizar esta acción.";
      } else if (error.response?.status === 422) {
        title = "Datos inválidos";
        text = "Verifica la información ingresada.";

        const erroresBackend = error.response.data.errors;
        const mapeoErrores = {};

        Object.keys(erroresBackend).forEach((key) => {
          mapeoErrores[key] = erroresBackend[key][0];
        });

        console.error(mapeoErrores)
      }

      Swal.close();

      Swal.fire({
        icon,
        title,
        text,
        confirmButtonColor: "#802907",
      });

      console.error(error);
    }
  }, [createPartner, createPosition, createUser, deletePartner, deletePosition, deleteUser, refetchPartners, setSearchParams, updatePartner, updatePosition, updateUser]
  )

  const generarEnlaceRegistro = async () => {
    Swal.fire({ title: 'Generando enlace...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
      const response = await axios.post(`${API_URL}/api/enlaces-registro`);
      const { url } = response.data;
      Swal.fire({
        icon: 'success',
        title: 'Enlace de registro generado',
        html: `
          <p class="text-sm text-gray-600 mb-3">Válido por 30 minutos y solo puede usarse una vez. Compártelo con la persona que se va a registrar.</p>
          <input id="enlace-registro-input" type="text" readonly value="${url}" class="swal2-input" style="font-size:12px;" />
        `,
        confirmButtonText: 'Copiar enlace',
        confirmButtonColor: '#802907',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        preConfirm: async () => {
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            // S el navegador bloquea el portapapeles, el usuario puede copiarlo manualmente del campo.
            alert("No se pudo copiar el enlace")
          }
          return true;
        },
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({ icon: 'success', title: 'Copiado', text: 'El enlace fue copiado al portapapeles.', confirmButtonColor: '#802907' });
        }
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo generar el enlace',
        text: err.response?.data?.message || 'Ocurrió un problema al generar el enlace de registro.',
        confirmButtonColor: '#802907',
      });
    }
  };

  const crearPuesto = async () => {
    if (!nuevoPuesto.trim()) {
      setErrorPuesto("Ingrese un nombre de puesto.");
      return;
    }

    if (puestos.some(i => i.nombre.trim() == nuevoPuesto.trim())) {
      setErrorPuesto("Ya existe un puesto con ese nombre");
      return;
    }
    await handleSaveChanges({ mode: "create", payload: { nombre: nuevoPuesto.trim() }, type: "position" })
    setNuevoPuesto("");

  };

  const abrirModalEditarSocio = (socio) => {
    setSearchParams({ type: "partner", action: "edit", id: socio.id })
  };

  const eliminarSocio = (socio) => {
    setSearchParams({ type: "partner", action: "delete", id: socio.id })
  };

  const editarPuesto = (puesto) => {
    setEditarPuestoId(puesto.id);
    setEditarPuestoNombre(puesto.nombre);
    setErrorPuesto("");
  };


  const abrirModalCrear = () => {
    setSearchParams({ type: "user", action: "create" })
  };

  const abrirModalSocio = () => {
    setSearchParams({ type: "partner", action: "create" })
  };

  const abrirModalDetalleSocio = (socio) => {
    setSearchParams({ type: "partner", action: "view", id: socio.id })
  };

  const cerrarModal = () => {
    setSearchParams({})
  };


  // --- LÓGICA DE FILTRADO (BUSCADORES) ---
  const usuariosFiltrados = usuarios?.filter(
    user =>
      user.name.toLowerCase().includes(filtroUsuarios.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(filtroUsuarios.toLowerCase()) ||
      user.usuario.toLowerCase().includes(filtroUsuarios.toLowerCase()) ||
      (user.puesto?.nombre || "").toLowerCase().includes(filtroUsuarios.toLowerCase())
  );

  const puestosFiltrados = puestos?.filter(
    puesto => puesto.nombre.toLowerCase().includes(filtroPuestos.toLowerCase())
  );

  // --- ESTILOS PERSONALIZADOS PARA MATCHEAR TU PÁGINA ---
  const customStyles = {
    tableWrapper: {
      style: {
        borderTop: '1.5px solid #d5d7db', // Línea separadora sutil
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
  const columnas = useMemo(() => {
    const abrirModalEditar = (user) => {
      if (!puedeEditarUsuarios) return alert("No tienes permisos para editar usuarios.");
      setSearchParams({ type: "user", action: "edit", id: user.id });
    };
    const abrirModalEliminar = (user) => {
      if (user.id === usuarioLogueado.id) return alert("Acción denegada: No puedes eliminar tu propia cuenta.");
      setSearchParams({ type: "user", action: "delete", id: user.id });
    };


    return [
      { name: 'Nombre', selector: row => `${row.name} ${row.lastname}`, sortable: true },
      { name: 'Usuario', selector: row => row.usuario, sortable: true },
      { name: 'Puesto', selector: row => row.puesto?.nombre || "N/A", sortable: true },
      {
        name: 'Acciones',
        minWidth: '180px',
        cell: row => (
          <div className="flex space-x-2">
            <IconButton
              icon={Pencil}
              variant="primary"
              title="Editar"
              filled={false}
              isDisabled={!puedeEditarUsuarios || (row.puesto?.nombre === 'SistemasAdmin' && !esAdmin)}
              onClick={() => abrirModalEditar(row)}
            />
            <IconButton
              icon={Trash2}
              variant="danger"
              title="Eliminar"
              filled={false}
              isDisabled={!puedeEliminarUsuarios || row.id === usuarioLogueado.id}
              onClick={() => abrirModalEliminar(row)}
            />
          </div>
        ),
        ignoreRowClick: true,
        allowOverflow: true,
      },
    ]
  }, [setSearchParams, puedeEditarUsuarios, esAdmin, puedeEliminarUsuarios, usuarioLogueado.id]);

  const columnasPuestos = useMemo(() => {

    const guardarEdicionPuesto = async () => {

      if (!editarPuestoNombre.trim()) {
        Swal.fire({
          toast: true,
          position: "top",
          icon: "warning",
          title: "Ingrese un nombre de puesto",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }

      if (puestos.some(i => i.nombre.trim() == editarPuestoNombre.trim())) {
        Swal.fire({
          toast: true,
          position: "top",
          icon: "warning",
          title: "Ya existe un puesto con ese nombre",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }

      Swal.fire({ title: 'Procesando...', text: 'Actualizando el nombre del puesto.', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
      await handleSaveChanges({ mode: "edit", payload: { id: editarPuestoId, nombre: editarPuestoNombre.trim() }, type: "position" })
      setEditarPuestoId(null);

    };


    const eliminarPuesto = async (id) => {
      setSearchParams({ type: "position", action: "delete", id: id })
      return
    };

    const editarPermisosPuesto = (id) => {
      setSearchParams({ type: "position", action: "permisos", id: id })
    };

    return [
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
              <div className="flex space-x-2">
                <IconButton
                  icon={Check}
                  variant="success"
                  title="Guardar"
                  onClick={guardarEdicionPuesto}
                />
                <IconButton
                  icon={X}
                  variant="secondary"
                  title="Cancelar"
                  onClick={() => { setEditarPuestoId(null); setEditarPuestoNombre(""); setErrorPuesto(""); }}
                />
              </div>
            );
          }
          return (
            <div className="flex space-x-2">
              <IconButton
                icon={Pencil}
                variant="primary"
                title="Editar"
                filled={false}
                onClick={() => editarPuesto(row)}
              />
              {row.nombre !== 'SistemasAdmin' && (
                <IconButton
                  icon={ShieldCheck}
                  variant="secondary"
                  title="Permisos predeterminados"
                  filled={false}
                  onClick={() => editarPermisosPuesto(row.id)}
                />
              )}
              <IconButton
                icon={Trash2}
                variant="danger"
                title="Eliminar"
                filled={false}
                onClick={() => eliminarPuesto(row.id)}
              />
            </div>
          );
        },
        ignoreRowClick: true,
        allowOverflow: true,
      }
    ]
  }, [editarPuestoId, editarPuestoNombre, handleSaveChanges, puestos, setSearchParams]);

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

  //if (usersIsLoading) return
  if (!puedeVerUsuarios) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-red-200">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes los permisos necesarios para ver este directorio.</p>
      </div>
    );
  }
  return (
    <div className="p-6 relative">

      {/* TABLA USUARIOS CON ESTILO DATATABLES */}
      <div className=" rounded-3xl border border-gray-200 bg-white p-6 flex flex-col">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Directorio de Usuarios</h3>
          </div>
          {puedeCrearUsuarios && (
            <div className="flex gap-2">
              <Button variant="outline" Icon={Link} onClick={generarEnlaceRegistro}>
                Crear Nuevo Usuario
              </Button>
              <Button Icon={PlusIcon} onClick={abrirModalCrear}>
                Crear Nuevo Usuario
              </Button>
            </div>
          )}
        </div>

        <DataTable
          className="mt-4"
          columns={columnas}
          data={usuariosFiltrados} // <-- Pasamos el arreglo filtrado
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]} // Opciones clásicas de DataTables
          highlightOnHover
          responsive
          customStyles={customStyles} // <-- Aplica los estilos de Tailwind
          subHeaderComponent={BuscadorUsuarios} // <-- Inserta el input de búsqueda arriba a la derecha
          noDataComponent={<div className="p-8 text-gray-500 text-center">No se encontraron usuarios.</div>}
          progressPending={usersIsLoading}
          progressComponent={<div className="p-8 text-gray-600 font-semibold text-center">Cargando directorio...</div>}
        />
      </div>


      {/* SECCIÓN DE SOCIOS */}
      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Directorio de Socios</h3>
            <p className="text-sm text-gray-500">Asocia a un operador con su socio y revisa los usuarios vinculados.</p>
          </div>
          <Button Icon={PlusIcon} onClick={abrirModalSocio}>
            Agregar socio
          </Button>
        </div>

        <div className="mt-4  ">
          <div className="grid gap-2 text-sm text-gray-700">
            {socios && socios.length === 0 ? (
              <p className="text-gray-500">No hay socios registrados.</p>
            ) : socios && socios.map((socio) => (
              <div
                key={socio.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50 bg-white"
              >
                <button
                  type="button"
                  onClick={() => abrirModalDetalleSocio(socio)}
                  className="flex-1 text-left"
                >
                  <p className="font-semibold text-gray-800">{socio.nombre}</p>
                  <p className="text-xs text-gray-500">{socio.telefono || 'Sin teléfono'} · {socio.correo || 'Sin correo'} · {socio.estado}</p>
                </button>
                <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{socio.usuarios_count ?? socio.usuarios?.length ?? 0} asignado(s)</span>
                <div className="flex space-x-1">
                  <IconButton
                    icon={Pencil}
                    variant="primary"
                    title="Editar"
                    filled={false}
                    onClick={() => abrirModalEditarSocio(socio)}
                  />
                  <IconButton
                    icon={Trash2}
                    variant="danger"
                    title="Eliminar"
                    filled={false}
                    onClick={() => eliminarSocio(socio)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE PUESTOS */}
      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Directorio de Puestos</h3>
            <p className="text-sm text-gray-500">Los puestos creados aquí no tendrán permisos de SistemasAdmin.</p>
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <Input type="text" value={nuevoPuesto} onChange={handleNuevoPuestoChange} placeholder="Nombre del nuevo puesto" error={errorPuesto} />
            <Button Icon={PlusIcon} onClick={crearPuesto}>
              Agregar
            </Button>
          </div>
        </div>
        <DataTable
          columns={columnasPuestos}
          data={puestosFiltrados} // <-- Pasamos el arreglo filtrado
          pagination
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 20]}
          highlightOnHover
          responsive
          customStyles={customStyles} // <-- Aplica los estilos de Tailwind
          //subHeader
          subHeaderComponent={BuscadorPuestos} // <-- Inserta el input de búsqueda arriba a la derecha
          noDataComponent={<div className="p-8 text-gray-500 text-center">No hay puestos registrados en el sistema.</div>}
        />
      </div>

      <UsersFormModal open={shouldOpenUserModal && (isCreate || isEdit)} onClose={cerrarModal} mode={action} user={usuarios?.find(u => u.id == actionId)} onSave={handleSaveChanges} />
      <UserDeleteModal open={shouldOpenUserModal && (isDelete)} onClose={cerrarModal} user={usuarios?.find(u => u.id == actionId)} onSubmit={handleSaveChanges} />

      <PartnerFormModal open={shouldOpenPartnerModal && ((isCreate || isEdit))} mode={action} partner={socios?.find(u => u.id == actionId)} onClose={cerrarModal} onSave={handleSaveChanges} />
      <PartnerDeleteModal open={shouldOpenPartnerModal && (isDelete)} onClose={cerrarModal} partner={socios?.find(u => u.id == actionId)} onSubmit={handleSaveChanges} />
      <PartnerViewModal open={shouldOpenPartnerModal && isView} partner={socios?.find(u => u.id == actionId)} onClose={cerrarModal} />

      <PositionDeleteModal open={shouldOpenPositionModal && isDelete} position={puestos?.find(u => u.id == actionId)} onClose={cerrarModal} onSubmit={handleSaveChanges} />
      <PositionPermissionsModal open={shouldOpenPositionModal && isPermisos} position={puestos?.find(u => u.id == actionId)} onClose={cerrarModal} onSubmit={handleSaveChanges} />
    </div>
  );
}

export default Usuarios;