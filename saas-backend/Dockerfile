FROM php:8.2-apache

# Cài package cần thiết
RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev zip unzip git curl gnupg \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip

# Cài Node.js (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Kích hoạt mod_rewrite và chỉnh DocumentRoot về /public
RUN a2enmod rewrite



RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Làm việc trong thư mục app
WORKDIR /var/www/html
COPY . .

# Cài Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Cài Laravel dependencies
RUN composer install --no-dev --optimize-autoloader

# Cài và build Vite (React/Vue)
RUN npm ci
RUN npm run build

# Phân quyền Laravel
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80

# Khởi động Apache và đảm bảo storage được link
CMD php artisan config:cache && php artisan route:cache && rm -rf public/storage && php artisan storage:link && apache2-foreground

# Tạo thư mục storage nếu chưa có
RUN mkdir -p storage/app/public/models/thumbnails
RUN chown -R www-data:www-data storage/app/public

# Final check: Ensure ONLY mpm_prefork is enabled
RUN rm -f /etc/apache2/mods-enabled/mpm_worker.load /etc/apache2/mods-enabled/mpm_worker.conf \
    /etc/apache2/mods-enabled/mpm_event.load /etc/apache2/mods-enabled/mpm_event.conf \
    && a2dismod mpm_event mpm_worker || true \
    && a2enmod mpm_prefork
