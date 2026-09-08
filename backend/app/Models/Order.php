<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'city',
        'country',
        'items',
        'subtotal_usd',
        'discount_usd',
        'shipping_fee_usd',
        'total_usd',
        'status',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal_usd' => 'decimal:2',
        'discount_usd' => 'decimal:2',
        'shipping_fee_usd' => 'decimal:2',
        'total_usd' => 'decimal:2',
    ];

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
