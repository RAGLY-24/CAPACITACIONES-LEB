import { useModalSeccion } from "../../hooks/contenido/useModalSeccion";
import { Modal } from "../../components/Modal";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import Input from "../../components/Fields/Input";
import Select from "../../components/Fields/Select";
import Button from "../../components/Buttons/Button";

export function ModalSeccion({
    open,
    tipo,
    datos,
    secciones,
    onGuardar,
    onCerrar,
}) {
    useLockBodyScroll();

    const {
        form,
        errs,
        saving,
        handle,
        submit,
    } = useModalSeccion({
        tipo,
        datos,
        onGuardar,
    });

    const opcionesSecciones = secciones
        .filter((s) => s.id !== datos?.id)
        .map((sec) => ({
            value: sec.id,
            label: sec.nombre,
        }));

    const estadoOptions = [
        {
            value: "Activo",
            label: "Activo",
        },
        {
            value: "Inactivo",
            label: "Inactivo",
        },
    ];
    if (!open) return null

    return (
        <Modal
            open={open}
            title={tipo === "crear" ? "Nuevo Curso" : "Editar Curso"}
            size="md"
            aspect="default"
            onClose={onCerrar}
            footer={
                <>
                    <Button variant="outline" onClick={onCerrar} type="button">
                        Cancelar
                    </Button>
                    <Button isPending={saving} type="submit" form="form-seccion">
                        {tipo === "crear"
                            ? "Crear Curso"
                            : "Guardar"}
                    </Button>
                </>
            }
        >
            <form
                id="form-seccion"
                onSubmit={submit}
                className="grid grid-cols-1 gap-4"
            >
                <Input
                    name="nombre"
                    label="Nombre"
                    placeholder="Ej: Seguridad Laboral"
                    isRequired
                    value={form.nombre}
                    onChange={handle}
                    error={errs.nombre}
                    maxLength={150}
                />

                <Input
                    name="descripcion"
                    label="Descripción"
                    placeholder="Descripción breve del curso..."
                    value={form.descripcion}
                    onChange={handle}
                    maxLength={1000}
                />

                <Select
                    label="Estado"
                    name="estado"
                    value={form.estado}
                    onChange={handle}
                    options={estadoOptions}
                />

                <Select
                    label="Curso requerido antes de este"
                    name="seccion_requerida_id"
                    value={form.seccion_requerida_id || ""}
                    onChange={handle}
                    options={opcionesSecciones}
                    placeholder="Ninguna (no depende de otra)"
                />

                <p className="-mt-2 text-xs text-gray-400">
                    Esto ayuda a indicar qué contenido debe completarse antes.
                </p>
            </form>
        </Modal>
    );
}