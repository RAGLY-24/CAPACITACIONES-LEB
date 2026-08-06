import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useMe } from "../../../../hooks/auth/useMe";
import { usePartners } from "../../../../hooks/partners/usePartners";
import { Modal } from "../../../../components/Modal";
import { usePositions } from "../../../../hooks/position/usePositions";

export default function UsersFormModal({
    open, // Recibe el objeto state del hook de overlay en lugar de open/onClose sueltos
    mode,
    user,
    onSave,
    onClose
}) {

    const handleClose = () => {
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
                    onClose()
                    setIsDirty(false)
                }
            });
            return;
        }
        onClose()
        setIsDirty(false)
    }

    const {
        data: partners,
        isLoading: partnersIsLoading
    } = usePartners();

    const {
        data: puestos,
        isLoading: puestosIsLoading
    } = usePositions();


    const { data } = useMe();

    const storedUser = typeof window !== 'undefined' ? data : null;

    const usuarioLogueado = { id: storedUser?.id || null, rol: storedUser?.puesto?.nombre || null };

    const esAdmin = usuarioLogueado.rol === 'SistemasAdmin';
    const permisosUsuario = storedUser?.permissions || {};
    const puedeAsignarPermisos = esAdmin || permisosUsuario.assign_permissions;

    const initialState = {
        name: "", lastname: "", email: "", usuario: "",
        password: "", confirmPassword: "", puesto_id: "", socio_id: "", estado: "Activo",
        es_operador: false,
        operador_nombre_completo: "",
        operador_numero_economico_tractor: "",
        operador_placas_remolque: "",
        operador_folio: "",
        operador_numero_licencia: "",
        permissions: {
            create_users: false, delete_users: false, manage_news: false,
            edit_capacitaciones_course: false, manage_passwords: false,
            assign_permissions: false, news_access: true, view_reports: false,
            manage_content: false,
        }
    };


    const [formData, setFormData] = useState(initialState);

    const [isDirty, setIsDirty] = useState(false);

    const [permissionsOpen, setPermissionsOpen] = useState(false);

    const handleEsOperadorChange = (e) => {
        const esOperador = e.target.value === "si";
        setFormData({
            ...formData,
            es_operador: esOperador,
            ...(esOperador ? {} : {
                operador_nombre_completo: "",
                operador_numero_economico_tractor: "",
                operador_placas_remolque: "",
                operador_folio: "",
                operador_numero_licencia: "",
            }),
        });
        setIsDirty(true);
        setErroresForm({
            ...erroresForm,
            operador_nombre_completo: null,
            operador_numero_economico_tractor: null,
            operador_placas_remolque: null,
            operador_folio: null,
            operador_numero_licencia: null,
        });
    };

    useEffect(() => {
        if (mode === "edit" && user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                ...user,
                password: "", confirmPassword: "", socio_id: user.socio_id || "",
                es_operador: !!user.es_operador,
                operador_nombre_completo: user.operador_nombre_completo || "",
                operador_numero_economico_tractor: user.operador_numero_economico_tractor || "",
                operador_placas_remolque: user.operador_placas_remolque || "",
                operador_folio: user.operador_folio || "",
                operador_numero_licencia: user.operador_numero_licencia || "",
                permissions: { ...initialState.permissions, ...user.permissions },
            });

        } else {
            setFormData(initialState);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, user, open]);

    const handleChange = ({ target: { name, value } }) => {
        setIsDirty(true)
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
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

        if (mode === 'create') {
            if (!formData.password) nuevosErrores.password = "La contraseña es obligatoria (mín. 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial).";
            else if (!regexPassword.test(formData.password)) nuevosErrores.password = "Debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.";
            if (formData.password !== formData.confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden.";
        } else if (mode === 'edit' && formData.password) {
            if (!regexPassword.test(formData.password)) nuevosErrores.password = "Debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.";
            if (formData.password !== formData.confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden.";
        }

        if (formData.es_operador) {
            if (!formData.operador_nombre_completo) nuevosErrores.operador_nombre_completo = "El nombre completo del operador es obligatorio.";
            if (!formData.operador_numero_economico_tractor) nuevosErrores.operador_numero_economico_tractor = "El número económico del tracto es obligatorio.";
            if (!formData.operador_placas_remolque) nuevosErrores.operador_placas_remolque = "Las placas del remolque son obligatorias.";
            if (!formData.operador_folio) nuevosErrores.operador_folio = "El folio es obligatorio.";
            if (!formData.operador_numero_licencia) nuevosErrores.operador_numero_licencia = "El número de licencia es obligatorio.";
        }

        setErroresForm(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };


    const guardarUsuario = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;


        const formContent = { ...formData };
        if (!esAdmin && !permisosUsuario.assign_permissions) delete formContent.permissions;
        await onSave({ mode, payload: formContent, type: "user" });
    };

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setFormData({ ...formData, permissions: { ...formData.permissions, [name]: checked } });
        setIsDirty(true);
    };

    const [erroresForm, setErroresForm] = useState({});

    if (partnersIsLoading || puestosIsLoading) {
        return null
    }

    return (
        <Modal
            open={open}
            title={mode === "create" ? "Crear nuevo usuario" : "Editar Usuario"}
            size="xl"
            aspect="default"
            onClose={handleClose}
            footer={
                <>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        form="users-form"
                        className="rounded-lg bg-red-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 cursor-pointer"
                    >
                        {mode === "create" ? "Crear" : "Guardar cambios"}
                    </button>
                </>
            }
        >
            <form id="users-form" onSubmit={guardarUsuario} className="grid grid-cols-2 gap-6">
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
                        {partners.map((socio) => (
                            <option key={socio.id} value={socio.id}>{socio.nombre} {socio.empresa ? `- ${socio.empresa}` : ''}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">¿Es operador?</label>
                    <div className="flex gap-6">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input type="radio" name="es_operador" value="si" checked={formData.es_operador === true} onChange={handleEsOperadorChange}
                                className="h-4 w-4 text-[#802907] focus:ring-[#802907]" />
                            Sí
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input type="radio" name="es_operador" value="no" checked={formData.es_operador === false} onChange={handleEsOperadorChange}
                                className="h-4 w-4 text-[#802907] focus:ring-[#802907]" />
                            No
                        </label>
                    </div>
                </div>
                {formData.es_operador && (
                    <div className="col-span-2 grid grid-cols-2 gap-6 rounded-md bg-gray-50 p-4 border border-gray-200">
                        <div className="col-span-2">
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre completo de operador <span className="text-red-500">*</span></label>
                            <input type="text" name="operador_nombre_completo" value={formData.operador_nombre_completo} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                            {erroresForm.operador_nombre_completo && <p className="mt-1 text-xs text-red-500">{erroresForm.operador_nombre_completo}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Número de económico del tracto <span className="text-red-500">*</span></label>
                            <input type="text" name="operador_numero_economico_tractor" value={formData.operador_numero_economico_tractor} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                            {erroresForm.operador_numero_economico_tractor && <p className="mt-1 text-xs text-red-500">{erroresForm.operador_numero_economico_tractor}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Placas del remolque <span className="text-red-500">*</span></label>
                            <input type="text" name="operador_placas_remolque" value={formData.operador_placas_remolque} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                            {erroresForm.operador_placas_remolque && <p className="mt-1 text-xs text-red-500">{erroresForm.operador_placas_remolque}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Folio <span className="text-red-500">*</span></label>
                            <input type="text" name="operador_folio" value={formData.operador_folio} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                            {erroresForm.operador_folio && <p className="mt-1 text-xs text-red-500">{erroresForm.operador_folio}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Número de licencia <span className="text-red-500">*</span></label>
                            <input type="text" name="operador_numero_licencia" value={formData.operador_numero_licencia} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
                            {erroresForm.operador_numero_licencia && <p className="mt-1 text-xs text-red-500">{erroresForm.operador_numero_licencia}</p>}
                        </div>
                    </div>
                )}

                <div className="col-span-2 grid grid-cols-2 gap-6 rounded-md bg-gray-50 p-4 border border-gray-200">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Contraseña {mode === 'create' && <span className="text-red-500">*</span>}
                        </label>
                        <input type="password" name="password" placeholder={mode === 'edit' ? "Dejar en blanco para conservar" : ""} value={formData.password} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 focus:border-[#802907] focus:outline-none" />
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
            </form>
        </Modal>
    );
}