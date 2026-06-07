<?php

namespace App\Http\Middleware;

use App\Services\AuditService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ErrorLoggingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        // Only log errors (4xx and 5xx)
        $statusCode = $response->getStatusCode();

        if ($statusCode >= 400) {
            $context = [
                'endpoint' => $request->path(),
                'request_method' => $request->method(),
                'request' => $this->sanitizeRequest($request),
            ];

            AuditService::httpError(
                $statusCode,
                $this->getErrorMessage($statusCode),
                $context
            );
        }
    }

    private function sanitizeRequest(Request $request): array
    {
        $data = $request->all();

        // Remove sensitive fields
        $sensitiveFields = ['password', 'password_confirmation', 'token', 'api_key', 'secret', 'credit_card', 'cvv'];
        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        return $data;
    }

    private function getErrorMessage(int $code): string
    {
        return match ($code) {
            400 => 'Bad Request',
            401 => 'Unauthorized',
            402 => 'Payment Required',
            403 => 'Forbidden',
            404 => 'Not Found',
            405 => 'Method Not Allowed',
            409 => 'Conflict',
            422 => 'Validation Error',
            429 => 'Too Many Requests',
            500 => 'Internal Server Error',
            502 => 'Bad Gateway',
            503 => 'Service Unavailable',
            504 => 'Gateway Timeout',
            default => "HTTP Error {$code}",
        };
    }
}
