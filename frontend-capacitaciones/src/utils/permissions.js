// Catálogo de permisos: espejo de PermissionCatalog::KEYS en el backend
// (backend-capacitaciones/app/Support/PermissionCatalog.php). Única fuente
// para los checkboxes de permisos, tanto por usuario (UsersFormModal) como
// por rol/puesto (PositionPermissionsModal).
export const PERMISSION_CATALOG = [
    { key: "news_access", label: "Acceso a noticias" },
    { key: "manage_news", label: "Publicar noticias" },
    { key: "edit_trainings", label: "Editar capacitaciones" },
    { key: "create_users", label: "Crear usuarios" },
    { key: "delete_users", label: "Eliminar usuarios" },
    { key: "assign_permissions", label: "Asignar permisos" },
    { key: "manage_passwords", label: "Administrar contraseñas" },
    { key: "view_reports", label: "Ver reportes" },
    { key: "manage_content", label: "Gestionar contenido" },
];

export const emptyPermissions = () =>
    Object.fromEntries(PERMISSION_CATALOG.map(p => [p.key, false]));
