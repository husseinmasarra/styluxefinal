<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| STYLUXE REST API Routes
|--------------------------------------------------------------------------
*/

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'STYLUXE Luxury API',
        'timestamp' => now()->toISOString(),
    ]);
});

// Authentication
Route::post('/auth/login', [AuthController::class, 'login']);

// Categories API
Route::apiResource('categories', CategoryController::class);

// Brands API
Route::apiResource('brands', BrandController::class);

// Products API
Route::apiResource('products', ProductController::class);

// Orders API
Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{id}', [OrderController::class, 'show']);
Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);

// Settings API
Route::get('/settings', [SettingController::class, 'index']);
Route::post('/settings', [SettingController::class, 'update']);
