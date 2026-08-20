import { Navigate, Route, Routes } from "react-router-dom";
import Contenido from "../views/Contenido";
import Capacitaciones from "../views/Capacitaciones";
import { useMe } from "../hooks/auth/useMe";
import Noticias from "../views/News/Noticias";
import Usuarios from "../views/users/Usuarios";
import AdminPanel from "../views/Frame/AdminPanel";
import { BookText, Film, ListVideo, Newspaper, Pencil, User } from "lucide-react";
import Videos from "../views/Videos";
import ManageVideosView from "../views/Videos/ManageVideosView";


export function ProtectedRoutes() {
    const { data } = useMe();

    if (!data) return null

    const esAdmin = data.puesto?.nombre === 'SistemasAdmin';
    const permisos = data.permissions || {};
    const muestraNoticias = permisos.news_access !== false;
    const muestraUsuarios = esAdmin || permisos.create_users || permisos.delete_users || permisos.assign_permissions;
    const muestraContenido = esAdmin || permisos.edit_trainings;
    const muestraCapacitaciones = true;
    const muestraGestionVideos = esAdmin || permisos.manage_videos;

    const routesConfig = [
        {
            icon: Newspaper,
            label: "Noticias",
            path: "/noticias",
            element: <Noticias />,
            visible: muestraNoticias,
        },
        {
            icon: BookText,
            label: "Capacitaciones",
            path: "/capacitaciones",
            element: <Capacitaciones />,
            visible: muestraCapacitaciones,
        },

        {
            icon: Film,
            label: "Videos",
            path: "/videos",
            element: <Videos />,
            visible: true,
        },
        {
            icon: User,
            label: "Usuarios",
            path: "/usuarios",
            element: <Usuarios />,
            visible: muestraUsuarios,
        },
        {
            icon: ListVideo,
            label: "Gestionar videos",
            path: "/manage_videos",
            element: <ManageVideosView />,
            visible: muestraGestionVideos,
        },

        {
            icon: Pencil,
            label: "Gestionar Capacitaciones",
            path: "/contenido",
            element: <Contenido />,
            visible: muestraContenido,
        },


    ];

    const routes = routesConfig.filter(i => i.visible)

    const firstRoute = routes.at(0)?.path ?? "";


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