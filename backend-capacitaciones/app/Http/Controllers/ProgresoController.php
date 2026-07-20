<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\Seccion;
use App\Models\ProgresoModulo;
use App\Models\User;
use App\Services\ExamenCalificadorService;
use Illuminate\Support\Facades\Auth;

class ProgresoController extends Controller
{
    public function __construct(private ExamenCalificadorService $calificador)
    {
    }

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
            $requerido = $modulo->moduloRequeridoPara();
            $mensaje = $requerido
                ? "Debes aprobar el examen de \"{$requerido->nombre}\" primero."
                : 'Debes aprobar el módulo requerido primero.';
            return response()->json(['message' => $mensaje], 403);
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

        return response()->json($this->progresoAgrupadoPorSeccion($user), 200);
    }

    // GET /progreso/usuario/{id} — mismo formato que miProgreso, pero para que
    // el admin revise el avance de un operador específico en forma de tarjetas.
    public function progresoDeUsuario(int $userId)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $usuario = User::findOrFail($userId);

        return response()->json($this->progresoAgrupadoPorSeccion($usuario), 200);
    }

    private function progresoAgrupadoPorSeccion(User $user): array
    {
        $secciones = Seccion::where('estado', 'Activo')
            ->with(['modulos' => fn($q) => $q->where('estado', 'Activo')->withCount('preguntas')->orderBy('orden'), 'requiere:id,nombre'])
            ->orderBy('orden')
            ->get();

        $progresosMap = ProgresoModulo::where('user_id', $user->id)
            ->get()
            ->keyBy('modulo_id');

        // $secciones ya viene ordenado por seccion.orden y modulo.orden, así que aplanarlo
        // reproduce el mismo criterio que Modulo::ordenGlobal() sin volver a consultar la BD.
        $modulosOrdenados = $secciones->flatMap(fn($s) => $s->modulos)->values();
        $modulosPorId = $modulosOrdenados->keyBy('id');

        // Un módulo requiere el prerrequisito explícito del admin si se definió uno,
        // o si no, el anterior en el orden del curso (mismo criterio que Modulo::moduloRequeridoPara()).
        $bloqueado = [];
        $requeridoNombre = [];
        foreach ($modulosOrdenados as $idx => $modulo) {
            $requerido = $modulo->prerequisite_module_id
                ? $modulosPorId->get($modulo->prerequisite_module_id)
                : ($idx > 0 ? $modulosOrdenados[$idx - 1] : null);

            if (!$requerido || $requerido->preguntas_count === 0) {
                $bloqueado[$modulo->id] = false;
                continue;
            }

            $progresoRequerido = $progresosMap->get($requerido->id);
            $bloqueado[$modulo->id] = !($progresoRequerido && $progresoRequerido->estado === 'completado');
            if ($bloqueado[$modulo->id]) {
                $requeridoNombre[$modulo->id] = $requerido->nombre;
            }
        }

        // Una sección se considera aprobada si todos sus módulos con examen fueron completados.
        $seccionCompletada = $secciones->mapWithKeys(function ($seccion) use ($progresosMap) {
            $completada = $seccion->modulos
                ->where('preguntas_count', '>', 0)
                ->every(fn($m) => optional($progresosMap->get($m->id))->estado === 'completado');
            return [$seccion->id => $completada];
        });

        $resultado = $secciones->map(function ($seccion) use ($progresosMap, $bloqueado, $requeridoNombre, $seccionCompletada) {
            $seccionBloqueada = $seccion->seccion_requerida_id
                && !($seccionCompletada[$seccion->seccion_requerida_id] ?? true);

            $modulos = $seccion->modulos->map(function ($modulo) use ($progresosMap, $bloqueado, $requeridoNombre) {
                $progreso = $progresosMap->get($modulo->id);
                return [
                    'progreso_id'     => $progreso?->id,
                    'modulo'          => $modulo,
                    'estado'          => $progreso?->estado ?? 'pendiente',
                    'puntaje'         => $progreso?->puntaje,
                    'intentos'        => $progreso?->intentos ?? 0,
                    'started_at'      => $progreso?->started_at,
                    'completed_at'    => $progreso?->completed_at,
                    'tiene_examen'    => $modulo->preguntas_count > 0,
                    'desbloqueado'    => !$bloqueado[$modulo->id],
                    'requiere_modulo' => $requeridoNombre[$modulo->id] ?? null,
                ];
            });

            return [
                'seccion'            => $seccion,
                'modulos'            => $modulos,
                'desbloqueada'       => !$seccionBloqueada,
                'seccion_requerida'  => $seccionBloqueada ? $seccion->requiere?->nombre : null,
            ];
        });

        return $resultado->all();
    }

    // GET /progreso/admin — reporte completo para el administrador
    public function resumenAdmin()
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $progresos = ProgresoModulo::with([
            'user:id,name,lastname,usuario,socio_id',
            'user.socio:id,nombre',
            'modulo' => fn($q) => $q->select('id', 'nombre', 'estado', 'seccion_id')->withCount('preguntas'),
            'modulo.seccion:id,nombre',
        ])
        ->orderByDesc('updated_at')
        ->get()
        ->map(fn($p) => [
            'id'            => $p->id,
            'user_id'       => $p->user_id,
            'usuario'       => trim($p->user?->name . ' ' . $p->user?->lastname),
            'usuario_login' => $p->user?->usuario,
            'socio'         => $p->user?->socio?->nombre,
            'modulo'        => $p->modulo?->nombre,
            'modulo_id'     => $p->modulo_id,
            'seccion'       => $p->modulo?->seccion?->nombre ?? 'Sin sección',
            'seccion_id'    => $p->modulo?->seccion_id,
            'estado'        => $p->estado,
            'puntaje'       => $p->puntaje,
            'intentos'      => $p->intentos,
            'tiene_examen'  => $p->modulo?->preguntas_count > 0,
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

        // Una sola consulta para todos los módulos de todas las secciones, en vez de
        // una consulta por sección dentro del map() de abajo.
        $todosModuloIds = $secciones->flatMap(fn($s) => $s->modulos->pluck('id'))->all();
        $progresosPorModulo = ProgresoModulo::whereIn('modulo_id', $todosModuloIds)
            ->get()
            ->groupBy('modulo_id');

        $resultado = $secciones->map(function ($seccion) use ($totalUsuarios, $progresosPorModulo) {
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

            $progresos = collect($moduloIds)->flatMap(fn($id) => $progresosPorModulo->get($id, collect()));
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

    // GET /progreso/{id}/retroalimentacion — detalle pregunta por pregunta de
    // un intento ya calificado. El dueño del progreso puede ver el suyo; el
    // admin puede ver el de cualquier operador.
    public function retroalimentacionAdmin(int $progresoId)
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $progreso = ProgresoModulo::with(['user:id,name,lastname,usuario', 'modulo.preguntas.opciones'])
            ->findOrFail($progresoId);

        if ($progreso->user_id !== $user->id && !$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        if (!$progreso->respuestas) {
            return response()->json(['message' => 'Este operador aún no ha contestado este examen.'], 404);
        }

        ['aciertos' => $aciertos, 'total' => $total, 'resultados' => $resultados] =
            $this->calificador->calificar($progreso->modulo, $progreso->respuestas);

        return response()->json([
            'usuario'       => trim($progreso->user?->name . ' ' . $progreso->user?->lastname),
            'usuario_login' => $progreso->user?->usuario,
            'modulo'        => $progreso->modulo?->nombre,
            'puntaje'       => $progreso->puntaje,
            'aprobado'      => $progreso->estado === 'completado',
            'estado'        => $progreso->estado,
            'aciertos'      => $aciertos,
            'total'         => $total,
            'resultados'    => $resultados,
        ], 200);
    }
}
