# === STAGE 1: COMPOSER DEPENDENCIES ===
FROM composer:2 AS vendor_backend
WORKDIR /app

# Copy dependency mappings first for optimal layer caching
COPY composer.json composer.lock ./

# Install only production dependencies without dev tools or scripts
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-plugins \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# === STAGE 2: PRODUCTION RUNTIME ===
FROM php:8.3-fpm-alpine

# Install system extensions required for Laravel APIs
RUN apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    zip \
    libzip-dev \
    unzip \
    git \
    curl \
    oniguruma-dev \
    postgresql-dev

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring zip exif pcntl gd

# Install and enable OPcache for production performance
RUN docker-php-ext-install opcache
COPY ./docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Set deployment working directory
WORKDIR /var/www

# Copy application source code
COPY . .

# Copy pre-built vendor folders from Stage 1
COPY --from=vendor_backend /app/vendor ./vendor

# Set correct production file permissions for Laravel storage
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Switch to unprivileged web-server user for security
USER www-data

# Expose PHP-FPM port
EXPOSE 9000

CMD ["sh", "-c", "php artisan migrate --seed --force && php-fpm"]