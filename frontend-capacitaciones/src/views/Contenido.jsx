function Contenido() {
    const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const rol = storedUser?.puesto?.nombre || null;
    const puedeEditar = rol === 'SistemasAdmin' || rol === 'Gerente';

    if (!puedeEditar) {
        return (
            <div className="rounded-xl bg-white p-6 shadow-sm text-center">
                <h2 className="text-lg font-semibold text-red-600">Acceso Denegado</h2>
                <p className="text-sm text-gray-500">No tienes permisos para editar el contenido de las capacitaciones.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">Módulos de Capacitación</h2>
            <p className="text-sm text-gray-500">Como administrador, puedes crear y editar el contenido de las capacitaciones.</p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-md font-semibold text-gray-700">Estado de gestión</h3>
                <p className="text-sm text-gray-600">Desde aquí Gerente o SistemasAdmin pueden administrar los módulos y actualizar el contenido cuando sea necesario.</p>
            </div>
        </div>
    );
}
export default Contenido;