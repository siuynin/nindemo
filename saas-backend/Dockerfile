FROM php:8.2-apache

WORKDIR /var/www/html

# Copy toàn bộ mã nguồn
COPY . .

# Cài extension PHP cần thiết
RUN apt-get update && apt-get install -y libzip-dev zip unzip \
    && docker-php-ext-install pdo pdo_mysql zip

# Cài composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader

# Kích hoạt mod_rewrite
RUN a2enmod rewrite

# (Tùy chọn) Nếu có file config Apache thì copy, nếu không có thì bỏ qua
# COPY .docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

# Khi container khởi động
CMD cp .env.example .env \
    && php artisan migrate --force \
    && apache2-foreground
