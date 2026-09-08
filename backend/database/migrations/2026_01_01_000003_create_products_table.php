<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->enum('department', ['women', 'men'])->default('women');
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('category_name')->default('General');
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->string('brand_name')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('sale_price', 10, 2)->nullable();
            $table->decimal('cost_price', 10, 2)->nullable();
            $table->string('sku')->unique();
            $table->json('stock_per_size')->nullable();
            $table->integer('total_stock')->default(0);
            $table->json('colors')->nullable();
            $table->json('color_hexes')->nullable();
            $table->json('color_images')->nullable();
            $table->json('images')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_featured')->default(true);
            $table->boolean('is_new_arrival')->default(true);
            $table->boolean('is_pre_order')->default(false);
            $table->string('pre_order_note')->nullable();
            $table->integer('priority')->default(1000);
            $table->string('season')->default('All Seasons');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
