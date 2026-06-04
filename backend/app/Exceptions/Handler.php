<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use App\Services\AuditService;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->stopIgnoring([
            ValidationException::class,
            AuthenticationException::class,
            ModelNotFoundException::class,
            NotFoundHttpException::class,
            HttpException::class,
        ]);

        $this->reportable(function (Throwable $e) {
            $context = [
                'stack_trace' => $e->getTraceAsString(),
            ];

            if ($e instanceof ValidationException) {
                AuditService::validationError(
                    'Validation failed',
                    $e->errors(),
                    $context
                );
            } elseif ($e instanceof AuthenticationException) {
                AuditService::unauthorized('Unauthenticated', $context);
            } elseif ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                AuditService::notFound('Resource', $context);
            } elseif ($e instanceof HttpException) {
                AuditService::httpError(
                    (string)$e->getStatusCode(),
                    $e->getMessage() ?: 'HTTP Exception',
                    $context
                );
            } else {
                AuditService::serverError($e->getMessage(), $context);
            }
        });
    }
}
