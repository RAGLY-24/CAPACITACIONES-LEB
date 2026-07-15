<?php

namespace App\Services;

use App\Models\Modulo;

// Reconstruye el detalle de aciertos/fallos de un examen a partir de las
// respuestas seleccionadas (pregunta_id => opcion_id). La usan tanto el envío
// de un examen nuevo como la retroalimentación de uno ya contestado, para no
// duplicar la lógica de comparar cada opción contra la correcta.
class ExamenCalificadorService
{
    public function calificar(Modulo $modulo, array $respuestas): array
    {
        $aciertos = 0;
        $resultados = [];

        foreach ($modulo->preguntas as $pregunta) {
            $opcionSeleccionadaId = $respuestas[$pregunta->id] ?? null;
            $opcionCorrecta       = $pregunta->opciones->firstWhere('es_correcta', true);
            $acertada             = $opcionSeleccionadaId && $opcionCorrecta
                                     && (int) $opcionSeleccionadaId === $opcionCorrecta->id;

            if ($acertada) $aciertos++;

            $resultados[] = [
                'pregunta_id'         => $pregunta->id,
                'texto'               => $pregunta->texto,
                'opcion_seleccionada' => $opcionSeleccionadaId,
                'opcion_correcta_id'  => $opcionCorrecta?->id,
                'opcion_correcta'     => $opcionCorrecta?->texto,
                'acertada'            => $acertada,
                'opciones'            => $pregunta->opciones->map(fn($op) => [
                    'id'          => $op->id,
                    'texto'       => $op->texto,
                    'es_correcta' => $op->es_correcta,
                ]),
            ];
        }

        return [
            'aciertos'   => $aciertos,
            'total'      => $modulo->preguntas->count(),
            'resultados' => $resultados,
        ];
    }
}
