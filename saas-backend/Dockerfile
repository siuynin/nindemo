FROM php:8.2-apache

# Cài các extension cần thiết
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip

# Cài Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy code
WORKDIR /var/www/html
COPY . .

# Cài dependencies Laravel
RUN composer install --no-dev --optimize-autoloader

# Tạo storage và quyền
RUN chown -R www-data:www-data storage bootstrap/cache

# Kích hoạt mod_rewrite cho Apache
RUN a2enmod rewrite

# Expose port 80
EXPOSE 80

# Chạy cache và khởi động
CMD php artisan config:cache && php artisan route:cache && apache2-foreground
