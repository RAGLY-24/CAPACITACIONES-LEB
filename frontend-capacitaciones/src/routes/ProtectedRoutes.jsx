import { Navigate, Route, Routes } from "react-router-dom";
import AdminPanel from "../views/AdminPanel";
import Contenido from "../views/Contenido";
import Capacitaciones from "../views/Capacitaciones";
import Usuarios from "../views/Usuarios";
import { useMe } from "../hooks/auth/useMe";
import Noticias from "../views/News/Noticias";


export function ProtectedRoutes() {
    const { data } = useMe();

    if (!data) return null

    const esAdmin = data.puesto?.nombre === 'SistemasAdmin';
    const permisos = data.permissions || {};
    const muestraNoticias = permisos.news_access !== false;
    const muestraUsuarios = esAdmin || permisos.create_users || permisos.delete_users || permisos.assign_permissions;
    const muestraContenido = esAdmin || permisos.edit_trainings;
    const muestraCapacitaciones = true;

    const routesConfig = [
        {
            label: "Noticias",
            path: "noticias",
            element: <Noticias />,
            visible: muestraNoticias,
        },
        {
            label: "Capacitaciones",
            path: "capacitaciones",
            element: <Capacitaciones />,
            visible: muestraCapacitaciones,
        },
        {
            label: "Editar Contenido",
            path: "contenido",
            element: <Contenido />,
            visible: muestraContenido,
        },
        {
            label: "Usuarios",
            path: "usuarios",
            element: <Usuarios />,
            visible: muestraUsuarios,
        },
    ];

    const routes = routesConfig.filter(i => i.visible)

    const firstRoute = routes.at(0)?.path ?? "";

    // RETORNO DE RUTA POR DEFECTO
    return (
        <Routes>
            <Route path="/" element={<AdminPanel user={data} routes={routes} />}>
                <Route index element={<Navigate to={`/${firstRoute}`} replace />} />
                {routes
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={route.element}
                        />
                    ))}

                <Route path="*" element={<Navigate to={`/${firstRoute}`} replace />} />
            </Route>

            <Route path="*" element={<Navigate to={`/${firstRoute}`} replace />} />
        </Routes>
    );
}