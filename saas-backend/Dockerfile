FROM php:8.2-apache

# Cài extension
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

# Enable mod_rewrite và chỉnh DocumentRoot về /public
RUN a2enmod rewrite \
    && sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf \
    && sed -i 's|/var/www/|/var/www/html/public|g' /etc/apache2/apache2.conf

EXPOSE 80

CMD ["apache2-foreground"]
