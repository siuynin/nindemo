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

# Cấu hình Apache để lắng nghe trên PORT từ Railway
RUN sed -ri -e 's!Listen 80!Listen ${PORT:-80}!g' /etc/apache2/ports.conf
RUN sed -ri -e 's!<VirtualHost \*:80>!<VirtualHost *:${PORT:-80}>!g' /etc/apache2/sites-available/000-default.conf

# Thêm cấu hình AllowOverride All cho Laravel
RUN echo '<Directory /var/www/html/public>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/sites-available/000-default.conf

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

# Tạo thư mục storage nếu chưa có
RUN mkdir -p storage/app/public/models/thumbnails
RUN chown -R www-data:www-data storage/app/public

# Tạo script khởi động
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Cấu hình Apache port từ Railway\n\
if [ ! -z "$PORT" ]; then\n\
    sed -i.bak "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf\n\
    sed -i.bak "s/<VirtualHost \\*:80>/<VirtualHost *:$PORT>/g" /etc/apache2/sites-available/000-default.conf\n\
fi\n\
\n\
# Generate Laravel app key nếu chưa có\n\
if [ -z "$APP_KEY" ]; then\n\
    php artisan key:generate --force\n\
fi\n\
\n\
# Cache Laravel config\n\
php artisan config:cache\n\
php artisan route:cache\n\
php artisan view:cache\n\
\n\
# Tạo storage link nếu chưa có\n\
if [ ! -L "public/storage" ]; then\n\
    php artisan storage:link\n\
fi\n\
\n\
# Khởi động Apache\n\
exec apache2-foreground\n\
' > /usr/local/bin/start.sh && chmod +x /usr/local/bin/start.sh

EXPOSE ${PORT:-80}

# Khởi động với script
CMD ["/usr/local/bin/start.sh"]