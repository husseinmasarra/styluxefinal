<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'brand']);

        // Department filter (women / men)
        if ($request->has('department') && in_array($request->department, ['women', 'men'])) {
            $query->where('department', $request->department);
        }

        // Category filter
        if ($request->has('category') && $request->category !== 'all') {
            $cat = $request->category;
            $query->where(function ($q) use ($cat) {
                $q->where('category_name', 'like', "%{$cat}%")
                  ->orWhereHas('category', function ($cq) use ($cat) {
                      $cq->where('name', 'like', "%{$cat}%")
                         ->orWhere('slug', $cat);
                  });
            });
        }

        // Brand filter
        if ($request->has('brand') && $request->brand !== 'all') {
            $brand = $request->brand;
            $query->where(function ($q) use ($brand) {
                $q->where('brand_name', 'like', "%{$brand}%")
                  ->orWhereHas('brand', function ($bq) use ($brand) {
                      $bq->where('slug', $brand)
                         ->orWhere('name', 'like', "%{$brand}%");
                  });
            });
        }

        // Season filter
        if ($request->has('season') && $request->season !== 'all') {
            $query->where('season', $request->season);
        }

        // Search query
        if ($request->has('search') && !empty($request->search)) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('sku', 'like', "%{$s}%")
                  ->orWhere('brand_name', 'like', "%{$s}%")
                  ->orWhere('category_name', 'like', "%{$s}%");
            });
        }

        // Price filter
        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Sorting
        $sortBy = $request->get('sort', 'featured');
        switch ($sortBy) {
            case 'price-asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price-desc':
                $query->orderBy('price', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            default:
                $query->orderBy('priority', 'desc')->orderBy('created_at', 'desc');
                break;
        }

        $products = $query->get();

        return response()->json([
            'success' => true,
            'total' => $products->count(),
            'data' => $products,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'required|string|in:women,men',
            'category_id' => 'nullable|exists:categories,id',
            'category_name' => 'required|string',
            'brand_id' => 'nullable|exists:brands,id',
            'brand_name' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|unique:products,sku',
            'stock_per_size' => 'nullable|array',
            'total_stock' => 'nullable|integer',
            'colors' => 'nullable|array',
            'color_hexes' => 'nullable|array',
            'color_images' => 'nullable|array',
            'images' => 'nullable|array',
            'description' => 'nullable|string',
            'is_featured' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_pre_order' => 'boolean',
            'pre_order_note' => 'nullable|string',
            'priority' => 'integer',
            'season' => 'nullable|string',
        ]);

        $validated['slug'] = \Illuminate\Support\Str::slug($validated['title']) . '-' . time();
        if (empty($validated['sku'])) {
            $validated['sku'] = 'SKU-' . time();
        }

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $product = Product::with(['category', 'brand'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'department' => 'sometimes|required|string|in:women,men',
            'category_id' => 'nullable|exists:categories,id',
            'category_name' => 'sometimes|required|string',
            'brand_id' => 'nullable|exists:brands,id',
            'brand_name' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|unique:products,sku,' . $id,
            'stock_per_size' => 'nullable|array',
            'total_stock' => 'nullable|integer',
            'colors' => 'nullable|array',
            'color_hexes' => 'nullable|array',
            'color_images' => 'nullable|array',
            'images' => 'nullable|array',
            'description' => 'nullable|string',
            'is_featured' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_pre_order' => 'boolean',
            'pre_order_note' => 'nullable|string',
            'priority' => 'integer',
            'season' => 'nullable|string',
        ]);

        if (isset($validated['title'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['title']);
        }

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}
