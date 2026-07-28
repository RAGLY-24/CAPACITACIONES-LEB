import { Navigate, Route, Routes } from "react-router-dom";
import AdminPanel from "../views/AdminPanel";
import Noticias from "../views/Noticias";
import Contenido from "../views/Contenido";
import Capacitaciones from "../views/Capacitaciones";
import Usuarios from "../views/Usuarios";
import { useMe } from "../hooks/auth/useMe";

function AdminRedirect() {
    return <Navigate to="/noticias" replace />;
}


export function ProtectedRoutes() {
    const { data } = useMe();

    if (!data) return null
    // RETORNO DE RUTA POR DEFECTO
    return (
        <Routes>
            <Route path="/" element={<AdminPanel user={data} />}>
                <Route index element={<AdminRedirect />} />
                <Route path="noticias" element={<Noticias />} />
                <Route path="contenido" element={<Contenido />} />
                <Route path="capacitaciones" element={<Capacitaciones />} />
                <Route path="usuarios" element={<Usuarios />} />
                {/* Cualquier ruta dentro de /admin que no exista vuelve a noticias */}
                <Route path="*" element={<AdminRedirect />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}