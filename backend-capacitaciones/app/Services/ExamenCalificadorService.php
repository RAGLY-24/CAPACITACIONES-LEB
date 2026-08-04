<?php

namespace App\Services;

use App\Models\Modulo;
use App\Models\Pregunta;

// Reconstruye el detalle de aciertos/fallos de un examen a partir de las
// respuestas seleccionadas (pregunta_id => opcion_id, o pregunta_id => texto
// libre para preguntas de tipo feedback). La usan tanto el envío de un examen
// nuevo como la retroalimentación de uno ya contestado, para no duplicar la
// lógica de comparar cada opción contra la correcta.
//
// Las preguntas tipo "feedback" (opinión del operador sobre el módulo) se
// incluyen en `resultados` para poder mostrarlas, pero quedan fuera de
// `aciertos`/`total`: no se califican.
class ExamenCalificadorService
{
    public function calificar(Modulo $modulo, array $respuestas): array
    {
        $aciertos = 0;
        $total = 0;
        $resultados = [];

        foreach ($modulo->preguntas as $pregunta) {
            if ($pregunta->tipo === Pregunta::TIPO_FEEDBACK) {
                $resultados[] = [
                    'pregunta_id'     => $pregunta->id,
                    'texto'           => $pregunta->texto,
                    'tipo'            => Pregunta::TIPO_FEEDBACK,
                    'respuesta_texto' => $respuestas[$pregunta->id] ?? null,
                    'acertada'        => null,
                ];
                continue;
            }

            $total++;
            $opcionSeleccionadaId = $respuestas[$pregunta->id] ?? null;
            $opcionCorrecta       = $pregunta->opciones->firstWhere('es_correcta', true);
            $acertada             = $opcionSeleccionadaId && $opcionCorrecta
                                     && (int) $opcionSeleccionadaId === $opcionCorrecta->id;

            if ($acertada) $aciertos++;

            $resultados[] = [
                'pregunta_id'         => $pregunta->id,
                'texto'               => $pregunta->texto,
                'tipo'                => Pregunta::TIPO_OPCION_MULTIPLE,
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
            'total'      => $total,
            'resultados' => $resultados,
        ];
    }
}
