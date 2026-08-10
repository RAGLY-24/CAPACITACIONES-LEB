<?php

namespace App\Support;

// Lista única de llaves de permiso válidas, usada para validar tanto los
// permisos por defecto de un puesto (rol) como los permisos/overrides
// individuales de un usuario. Ver User::hasPermission() para cómo se
// resuelven en cascada (override del usuario > default del puesto > false).
class PermissionCatalog
{
    public const KEYS = [
        'news_access',
        'manage_news',
        'edit_trainings',
        'create_users',
        'delete_users',
        'assign_permissions',
        'manage_passwords',
        'view_reports',
        'manage_content',
    ];
}
