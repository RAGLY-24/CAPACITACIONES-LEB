function Contenido() {
    const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const rol = storedUser?.puesto?.nombre || null;

    if (rol !== 'SistemasAdmin') {
        return (
            <div className="rounded-xl bg-white p-6 shadow-sm text-center">
                <h2 className="text-lg font-semibold text-red-600">Acceso Denegado</h2>
                <p className="text-sm text-gray-500">No tienes permisos para editar el contenido.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">Módulos de Capacitación</h2>
            <p className="text-sm text-gray-500">Aquí podrás crear y editar los módulos y exámenes.</p>
        </div>
    );
}
export default Contenido;