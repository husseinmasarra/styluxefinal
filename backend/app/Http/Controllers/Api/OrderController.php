<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with('orderItems');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'total' => $orders->count(),
            'data' => $orders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email',
            'customer_phone' => 'required|string',
            'shipping_address' => 'required|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'items' => 'required|array|min:1',
            'subtotal_usd' => 'required|numeric|min:0',
            'discount_usd' => 'nullable|numeric|min:0',
            'shipping_fee_usd' => 'nullable|numeric|min:0',
            'total_usd' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            // Find or create customer
            $customer = null;
            if (!empty($validated['customer_phone'])) {
                $customer = Customer::firstOrCreate(
                    ['phone' => $validated['customer_phone']],
                    [
                        'name' => $validated['customer_name'],
                        'email' => $validated['customer_email'] ?? null,
                        'address' => $validated['shipping_address'],
                        'city' => $validated['city'] ?? 'Beirut',
                        'country' => $validated['country'] ?? 'Lebanon',
                    ]
                );
            }

            $orderNumber = 'STX-' . strtoupper(substr(uniqid(), -6));

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer ? $customer->id : null,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? '',
                'customer_phone' => $validated['customer_phone'],
                'shipping_address' => $validated['shipping_address'],
                'city' => $validated['city'] ?? 'Beirut',
                'country' => $validated['country'] ?? 'Lebanon',
                'items' => $validated['items'],
                'subtotal_usd' => $validated['subtotal_usd'],
                'discount_usd' => $validated['discount_usd'] ?? 0,
                'shipping_fee_usd' => $validated['shipping_fee_usd'] ?? 0,
                'total_usd' => $validated['total_usd'],
                'status' => 'pending',
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? '',
            ]);

            // Save order items
            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['productId'] ?? null,
                    'product_title' => $item['productTitle'] ?? $item['title'] ?? 'Item',
                    'brand_name' => $item['brandName'] ?? '',
                    'size' => $item['size'] ?? 'OneSize',
                    'color' => $item['color'] ?? 'Standard',
                    'price_usd' => $item['priceUSD'] ?? $item['price'] ?? 0,
                    'quantity' => $item['quantity'] ?? 1,
                    'image_url' => $item['imageUrl'] ?? ($item['images'][0] ?? ''),
                ]);
            }

            if ($customer) {
                $customer->increment('total_orders');
                $customer->increment('total_spent_usd', $validated['total_usd']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully',
                'data' => $order->load('orderItems'),
            ], 201);
        });
    }

    public function show(string $id): JsonResponse
    {
        $order = Order::with('orderItems')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:pending,processing,shipped,delivered,cancelled',
        ]);

        $order->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => $order,
        ]);
    }
}
