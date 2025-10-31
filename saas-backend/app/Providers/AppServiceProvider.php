<?php

namespace App\Providers;

use App\Models\PricingPlan;
use App\Observers\PricingPlanObserver;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register RunningHubImageService as singleton with ImageStorageService dependency
        $this->app->singleton(\App\Services\RunningHubImageService::class, function ($app) {
            return new \App\Services\RunningHubImageService($app->make(\App\Services\ImageStorageService::class));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS chỉ trong môi trường production
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Đăng ký PricingPlan observer để ngăn chặn ID trùng lặp
        PricingPlan::observe(PricingPlanObserver::class);

        Event::listen(
            \SePay\SePay\Events\SePayWebhookEvent::class,
            \App\Listeners\SePayWebhookListener::class,
        );
    }
}
