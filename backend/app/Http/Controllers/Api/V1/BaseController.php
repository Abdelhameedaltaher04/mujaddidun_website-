<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

abstract class BaseController extends Controller
{
    use AuthorizesRequests;

    protected function success(
        mixed $data = null,
        string $message = 'Request completed successfully.',
        int $status = 200,
    ): JsonResponse {
        return ApiResponse::success($data, $message, $status);
    }

    protected function error(
        string $message,
        mixed $errors = null,
        int $status = 400,
    ): JsonResponse {
        return ApiResponse::error($message, $errors, $status);
    }
}