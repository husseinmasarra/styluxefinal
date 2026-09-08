<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'department',
        'category_id',
        'category_name',
        'brand_id',
        'brand_name',
        'price',
        'sale_price',
        'cost_price',
        'sku',
        'stock_per_size',
        'total_stock',
        'colors',
        'color_hexes',
        'color_images',
        'images',
        'description',
        'is_featured',
        'is_new_arrival',
        'is_pre_order',
        'pre_order_note',
        'priority',
        'season',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'stock_per_size' => 'array',
        'colors' => 'array',
        'color_hexes' => 'array',
        'color_images' => 'array',
        'images' => 'array',
        'is_featured' => 'boolean',
        'is_new_arrival' => 'boolean',
        'is_pre_order' => 'boolean',
        'total_stock' => 'integer',
        'priority' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
