# Dockerfile
FROM php:8.2-apache

WORKDIR /var/www/html

# Copy project files
COPY . .

# Cài extension PHP
RUN apt-get update && apt-get install -y libzip-dev zip unzip \
    && docker-php-ext-install pdo pdo_mysql zip

# Cài composer dependencies
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader

# Enable mod_rewrite
RUN a2enmod rewrite

# Chỉ build xong thôi, KHÔNG artisan ở đây!
CMD php artisan key:generate --force && php artisan migrate --force && apache2-foreground
