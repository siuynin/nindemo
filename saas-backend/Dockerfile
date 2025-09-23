# Base PHP + Apache
FROM php:8.2-apache

# Cài extension cần cho Laravel
RUN apt-get update && apt-get install -y \
    libpng-dev libonig-dev libxml2-dev zip unzip git curl \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Cài Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy code
WORKDIR /var/www/html
COPY . .

# Cài dependency
RUN composer install --no-dev --optimize-autoloader

# Laravel optimize
RUN php artisan key:generate && \
    php artisan config:cache && \
    php artisan route:cache

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
