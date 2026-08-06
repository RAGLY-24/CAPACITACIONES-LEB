import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('es');

export function PrettyDate(fecha) {
    const ahora = dayjs();
    const fechaInput = dayjs(fecha);

    // Calcular la diferencia absoluta en horas
    const diferenciaHoras = Math.abs(ahora.diff(fechaInput, 'hour'));

    // Si tiene menos de 24 horas, muestra "hace 2 horas", "en 5 minutos", etc.
    if (diferenciaHoras < 24) {
        return fechaInput.fromNow();
    }

    // Si tiene 24 horas o más, muestra "13 agosto, 2025"
    return fechaInput.format('D MMMM, YYYY');
}
