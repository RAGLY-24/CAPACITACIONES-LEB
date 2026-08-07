import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useMe } from "../../../../hooks/auth/useMe";
import { usePartners } from "../../../../hooks/partners/usePartners";
import { Modal } from "../../../../components/Modal";
import { usePositions } from "../../../../hooks/position/usePositions";
import Button from "../../../../components/Buttons/Button";
import { PERMISSION_CATALOG, emptyPermissions } from "../../../../utils/permissions";
import Input from "../../../../components/Fields/Input";
import Select from "../../../../components/Fields/Select";
import PasswordInput from "../../../../components/Fields/PasswordInput";
import Checkbox from "../../../../components/Fields/Checkbox";

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
        permissions: { ...emptyPermissions(), news_access: true },
    };


    const [formData, setFormData] = useState(initialState);

    const [isDirty, setIsDirty] = useState(false);

    const [permissionsOpen, setPermissionsOpen] = useState(false);

    /*
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
     */

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
        // Al crear un usuario, elegir puesto precarga los permisos con los
        // valores predeterminados de ese rol (el admin puede seguir
        // marcando permisos especiales encima).
        if (name === "puesto_id" && mode === "create") {
            const puestoSeleccionado = puestos.find(p => String(p.id) === String(value));
            setFormData((prev) => ({
                ...prev,
                puesto_id: value,
                permissions: { ...emptyPermissions(), news_access: true, ...(puestoSeleccionado?.default_permissions || {}) },
            }));
            return;
        }
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const restablecerPermisosDelPuesto = () => {
        const puestoSeleccionado = puestos.find(p => String(p.id) === String(formData.puesto_id));
        if (!puestoSeleccionado) return;
        Swal.fire({
            title: '¿Restablecer permisos?',
            text: `Se reemplazarán los permisos actuales por los predeterminados del puesto "${puestoSeleccionado.nombre}". Se perderán los permisos especiales que tenga este usuario.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#802907',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, restablecer',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData(prev => ({
                    ...prev,
                    permissions: { ...emptyPermissions(), news_access: true, ...(puestoSeleccionado.default_permissions || {}) },
                }));
                setIsDirty(true);
            }
        });
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

    const partnerOptions = partners?.map((socio) => ({
        value: socio.id,
        label: `${socio.nombre}${socio.empresa ? ` - ${socio.empresa}` : ""}`,
    }));

    const puestoOptions = puestos?.map((puesto) => ({
        value: puesto.id,
        label: puesto.nombre,
    }));
    const estadoOptions = [
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" },
    ];

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
                    <Button variant="outline" onClick={handleClose} type="button">
                        Cancelar
                    </Button>
                    <Button type="submit" form="users-form">
                        {mode === "create" ? "Crear" : "Guardar"}
                    </Button>
                </>
            }
        >
            <form id="users-form" onSubmit={guardarUsuario} className="grid grid-cols-2 gap-2">

                <Input
                    name="name"
                    label="Nombre"
                    placeholder="Ej: Juan"
                    isRequired
                    value={formData.name}
                    onChange={handleChange}
                    error={erroresForm.name}
                />

                <Input
                    name="lastname"
                    label="Apellido"
                    placeholder="Ej: Pérez"
                    value={formData.lastname}
                    onChange={handleChange}
                />

                <Input
                    name="email"
                    label="Correo Electrónico"
                    type="email"
                    placeholder="Ej: usuario@empresa.com"
                    isRequired
                    value={formData.email}
                    onChange={handleChange}
                    error={erroresForm.email}
                />

                <Input
                    name="usuario"
                    label="Usuario de acceso"
                    placeholder="Ej: jperez"
                    isRequired
                    value={formData.usuario}
                    onChange={handleChange}
                    error={erroresForm.usuario}
                />

                <Select
                    label="Puesto"
                    isRequired
                    name="puesto_id"
                    value={formData.puesto_id}
                    onChange={handleChange}
                    options={puestoOptions}
                    placeholder="Seleccione un puesto"
                    error={erroresForm.puesto_id}
                />

                <Select
                    label="Estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    options={estadoOptions}
                />

                <Select
                    label="Socio / Empresa"
                    name="socio_id"
                    value={formData.socio_id || ""}
                    containerClassName="col-span-2"
                    onChange={handleChange}
                    options={partnerOptions}
                    placeholder="Sin asociación"
                />

                {/*
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
            */}
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

                <div className="col-span-2 grid grid-cols-2 gap-6 rounded-xl border border-gray-200  p-4">
                    <PasswordInput
                        label="Contraseña"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={
                            mode === "edit"
                                ? "Deja en blanco para conservar la actual"
                                : "Ingresa una contraseña"
                        }
                        isRequired={mode === "create"}
                        error={erroresForm.password}
                    />

                    <PasswordInput
                        label="Repetir Contraseña"
                        isRequired
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirma la contraseña"
                        error={erroresForm.confirmPassword}
                    />
                </div>

                {puedeAsignarPermisos && (
                    <div className="col-span-2 rounded-xl bg-white p-4 border border-gray-200 ">
                        <button type="button" onClick={() => setPermissionsOpen(!permissionsOpen)} className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-800">
                            <span>Permisos del usuario</span>
                            <span className="text-xs text-gray-500">{permissionsOpen ? 'Ocultar' : 'Mostrar'}</span>
                        </button>
                        {permissionsOpen && (
                            <>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 ">
                                    {PERMISSION_CATALOG.map((permission) => (
                                        <>
                                            <Checkbox
                                                key={permission.key}
                                                name={permission.key}
                                                label={permission.label}
                                                checked={formData.permissions?.[permission.key] || false}
                                                onChange={handlePermissionChange}
                                            />
                                        </>
                                    ))}

                                </div>
                                {formData.puesto_id && (
                                    <div className="mt-4">
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            onClick={restablecerPermisosDelPuesto}
                                        >
                                            Restablecer permisos del puesto
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </form>
        </Modal>
    );
}