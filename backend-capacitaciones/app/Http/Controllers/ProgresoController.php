<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\Seccion;
use App\Models\ProgresoModulo;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ProgresoController extends Controller
{
    private function esAdmin(): bool
    {
        $user = Auth::user();
        return $user instanceof User && ($user->puesto?->nombre === 'SistemasAdmin' || $user->hasPermission('edit_trainings'));
    }

    // POST /modulos/{id}/iniciar
    public function iniciar(int $moduloId)
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $modulo = Modulo::findOrFail($moduloId);
        if ($modulo->estado === 'Inactivo') {
            return response()->json(['message' => 'Módulo no disponible.'], 403);
        }
        if ($modulo->estaBloqueadoPara($user)) {
            return response()->json(['message' => 'Debes aprobar el examen del módulo anterior primero.'], 403);
        }

        $progreso = ProgresoModulo::firstOrCreate(
            ['user_id' => $user->id, 'modulo_id' => $moduloId],
            ['estado' => 'en_progreso', 'started_at' => now(), 'intentos' => 0]
        );

        return response()->json(['progreso' => $progreso], 200);
    }

    // GET /progreso/mio — progreso agrupado por sección para el empleado
    public function miProgreso()
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $secciones = Seccion::where('estado', 'Activo')
            ->with(['modulos' => fn($q) => $q->where('estado', 'Activo')->withCount('preguntas')->orderBy('orden')])
            ->orderBy('orden')
            ->get();

        $progresosMap = ProgresoModulo::where('user_id', $user->id)
            ->get()
            ->keyBy('modulo_id');

        $resultado = $secciones->map(function ($seccion) use ($progresosMap, $user) {
            $modulos = $seccion->modulos->map(function ($modulo) use ($progresosMap, $user) {
                $progreso = $progresosMap->get($modulo->id);
                return [
                    'modulo'       => $modulo,
                    'estado'       => $progreso?->estado ?? 'pendiente',
                    'puntaje'      => $progreso?->puntaje,
                    'intentos'     => $progreso?->intentos ?? 0,
                    'started_at'   => $progreso?->started_at,
                    'completed_at' => $progreso?->completed_at,
                    'tiene_examen' => $modulo->preguntas_count > 0,
                    'desbloqueado' => !$modulo->estaBloqueadoPara($user),
                ];
            });

            return [
                'seccion' => $seccion,
                'modulos' => $modulos,
            ];
        });

        return response()->json($resultado, 200);
    }

    // GET /progreso/admin — reporte completo para el administrador
    public function resumenAdmin()
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $progresos = ProgresoModulo::with([
            'user:id,name,lastname,usuario',
            'modulo:id,nombre,estado,seccion_id',
            'modulo.seccion:id,nombre',
        ])
        ->orderByDesc('updated_at')
        ->get()
        ->map(fn($p) => [
            'id'            => $p->id,
            'usuario'       => trim($p->user?->name . ' ' . $p->user?->lastname),
            'usuario_login' => $p->user?->usuario,
            'modulo'        => $p->modulo?->nombre,
            'seccion'       => $p->modulo?->seccion?->nombre ?? 'Sin sección',
            'seccion_id'    => $p->modulo?->seccion_id,
            'estado'        => $p->estado,
            'puntaje'       => $p->puntaje,
            'intentos'      => $p->intentos,
            'started_at'    => $p->started_at,
            'completed_at'  => $p->completed_at,
        ]);

        $resumenModulos = Modulo::withCount([
            'progresos',
            'progresos as completados_count' => fn($q) => $q->where('estado', 'completado'),
            'progresos as en_progreso_count'  => fn($q) => $q->where('estado', 'en_progreso'),
            'progresos as reprobados_count'   => fn($q) => $q->where('estado', 'reprobado'),
        ])->get();

        return response()->json([
            'progresos'      => $progresos,
            'resumen_modulos' => $resumenModulos,
        ], 200);
    }

    // GET /progreso/por-seccion — gráfica de pastel por sección
    public function porSeccion()
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $totalUsuarios = User::count();
        $secciones     = Seccion::with('modulos:id,seccion_id')->orderBy('orden')->get();

        $resultado = $secciones->map(function ($seccion) use ($totalUsuarios) {
            $moduloIds = $seccion->modulos->pluck('id')->toArray();

            if (empty($moduloIds)) {
                return [
                    'seccion_id'  => $seccion->id,
                    'nombre'      => $seccion->nombre,
                    'estado'      => $seccion->estado,
                    'completados' => 0,
                    'en_progreso' => 0,
                    'reprobados'  => 0,
                    'pendientes'  => $totalUsuarios,
                    'total'       => $totalUsuarios,
                ];
            }

            $progresos = ProgresoModulo::whereIn('modulo_id', $moduloIds)->get();
            $porUsuario = $progresos->groupBy('user_id');

            $completados = 0;
            $enProgreso  = 0;
            $reprobados  = 0;

            foreach ($porUsuario as $userId => $ups) {
                $modulosConProgreso = $ups->count();
                $todosCompletos     = $ups->every(fn($p) => $p->estado === 'completado');
                $algunoReprobado    = $ups->contains(fn($p) => $p->estado === 'reprobado');

                if ($todosCompletos && $modulosConProgreso === count($moduloIds)) {
                    $completados++;
                } elseif ($algunoReprobado) {
                    $reprobados++;
                } else {
                    $enProgreso++;
                }
            }

            $conProgreso = count($porUsuario);
            $pendientes  = max(0, $totalUsuarios - $conProgreso);

            return [
                'seccion_id'  => $seccion->id,
                'nombre'      => $seccion->nombre,
                'estado'      => $seccion->estado,
                'completados' => $completados,
                'en_progreso' => $enProgreso,
                'reprobados'  => $reprobados,
                'pendientes'  => $pendientes,
                'total'       => $totalUsuarios,
            ];
        });

        return response()->json($resultado, 200);
    }
}
