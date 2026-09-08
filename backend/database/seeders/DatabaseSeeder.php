<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Staff;
use App\Models\StoreSetting;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Initial Store Settings
        $settings = [
            'storeName' => 'STYLUXE',
            'tagline' => 'Redefining Luxury International Brands',
            'phone' => '+961 70 123 456',
            'email' => 'vip@styluxelb.com',
            'address' => 'Downtown Beirut, Allenby Street, Luxury Quarter',
            'activeCurrency' => 'USD',
            'lbpRate' => 89500,
            'eurRate' => 0.92,
            'taxRatePercent' => 0,
            'freeShippingThresholdUSD' => 500,
            'defaultShippingFeeUSD' => 25,
            'adminPin' => '1234',
            'posPasscode' => 'admin123',
            'enablePosBarcodeScanner' => true,
        ];

        foreach ($settings as $key => $val) {
            StoreSetting::set($key, $val);
        }

        // 2. Initial Staff
        Staff::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Store Owner',
                'email' => 'admin@styluxelb.com',
                'password' => Hash::make('admin123'),
                'role' => 'SUPER_ADMIN',
                'pin_code' => '1234',
                'status' => 'ACTIVE',
            ]
        );

        Staff::firstOrCreate(
            ['username' => 'cashier1'],
            [
                'name' => 'Downtown Cashier',
                'email' => 'cashier@styluxelb.com',
                'password' => Hash::make('123'),
                'role' => 'CASHIER',
                'pin_code' => '1111',
                'status' => 'ACTIVE',
            ]
        );

        // 3. Initial Brands
        $brands = [
            ['name' => 'PRADA', 'slug' => 'prada', 'logo_url' => 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400'],
            ['name' => 'GUCCI', 'slug' => 'gucci', 'logo_url' => 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=400'],
            ['name' => 'BALENCIAGA', 'slug' => 'balenciaga', 'logo_url' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'],
            ['name' => 'AMIRI', 'slug' => 'amiri', 'logo_url' => 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400'],
            ['name' => 'DIOR', 'slug' => 'dior', 'logo_url' => 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400'],
        ];

        foreach ($brands as $b) {
            Brand::firstOrCreate(['slug' => $b['slug']], $b);
        }

        // 4. Initial Categories (Women and Men strictly)
        $categories = [
            ['name' => "Women's Bags", 'slug' => 'womens-bags', 'department' => 'women', 'image_url' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', 'display_order' => 1],
            ['name' => "Women's Ready To Wear", 'slug' => 'womens-ready-to-wear', 'department' => 'women', 'image_url' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', 'display_order' => 2],
            ['name' => "Women's Shoes", 'slug' => 'womens-shoes', 'department' => 'women', 'image_url' => 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600', 'display_order' => 3],
            ['name' => "Men's Bags", 'slug' => 'mens-bags', 'department' => 'men', 'image_url' => 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', 'display_order' => 1],
            ['name' => "Men's Ready To Wear", 'slug' => 'mens-ready-to-wear', 'department' => 'men', 'image_url' => 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600', 'display_order' => 2],
            ['name' => "Men's Shoes", 'slug' => 'mens-shoes', 'department' => 'men', 'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'display_order' => 3],
        ];

        foreach ($categories as $c) {
            Category::firstOrCreate(['slug' => $c['slug']], $c);
        }
    }
}
