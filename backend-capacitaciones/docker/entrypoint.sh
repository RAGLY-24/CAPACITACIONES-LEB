#!/bin/sh
set -e

cd /var/www

if [ ! -f .env ]; then
    echo "No se encontró .env en /var/www. Copia .env.example a .env y configúralo antes de desplegar." >&2
    exit 1
fi

if ! grep -q "^APP_KEY=base64:" .env; then
    echo "Generando APP_KEY..."
    php artisan key:generate --force
fi

echo "Ejecutando migraciones (crea las tablas y el usuario Admin si no existe)..."
MAX_TRIES=30
i=0
until php artisan migrate --force --seed; do
    i=$((i + 1))
    if [ "$i" -ge "$MAX_TRIES" ]; then
        echo "No se pudo conectar/migrar la base de datos tras $MAX_TRIES intentos." >&2
        exit 1
    fi
    echo "Base de datos no disponible todavía, reintentando en 3s... ($i/$MAX_TRIES)"
    sleep 3
done

php artisan storage:link || true

if [ "$APP_ENV" = "production" ]; then
    echo "Cacheando configuración, rutas y vistas..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

exec "$@"
