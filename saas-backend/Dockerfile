FROM php:8.2-apache

# Cài dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev zip unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip

# Kích hoạt mod_rewrite và chỉnh DocumentRoot về /public
RUN a2enmod rewrite
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf

# Dọn log Apache warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

WORKDIR /var/www/html
COPY . .

# Cài composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Quyền truy cập
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80

CMD php artisan config:cache && php artisan route:cache && apache2-foreground
