<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('database.default') === 'sqlite' || app()->runningUnitTests()) {
            \Illuminate\Database\Connection::resolverFor('sqlite', function ($connection, $database, $prefix, $config) {
                $conn = new \Illuminate\Database\SQLiteConnection($connection, $database, $prefix, $config);
                $conn->setSchemaGrammar(new class($conn) extends \Illuminate\Database\Schema\Grammars\SQLiteGrammar {
                    public function compileUnique(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                    {
                        if (strpos($command->index, $blueprint->getTable()) !== 0) {
                            $command->index = $blueprint->getTable() . '_' . $command->index;
                        }
                        return parent::compileUnique($blueprint, $command);
                    }

                    public function compileIndex(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                    {
                        if (strpos($command->index, $blueprint->getTable()) !== 0) {
                            $command->index = $blueprint->getTable() . '_' . $command->index;
                        }
                        return parent::compileIndex($blueprint, $command);
                    }

                    protected function typeSet(\Illuminate\Support\Fluent $column)
                    {
                        return 'varchar';
                    }
                });
                return $conn;
            });
        }

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(100)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('sensitive', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }
}
