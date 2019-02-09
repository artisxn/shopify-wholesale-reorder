<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OhMyBrew\ShopifyApp\Facades\ShopifyApp;

class CustomerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth.shop');
    }

    public function search(Request $request)
    {
        $shop = ShopifyApp::shop();
        $s_request = $shop->api()->rest('GET', '/admin/customers/search.json', [
            'query' => $request->get('q')
        ]);
        return $s_request->body->customers;
    }

    public function orders($customer_id)
    {
        $shop = ShopifyApp::shop();
        $s_request = $shop->api()->rest('GET', "/admin/customers/$customer_id/orders.json", [
            'status' => 'any',
            'fields' => 'id,line_items',
            'limit' => 5
        ]);

        $map = [];
        foreach($s_request->body->orders as $order) {
            foreach ($order->line_items as $line_item) {
                if(!isset($map[$line_item->product_id])) {
                    $map[$line_item->product_id] = [
                        'id' => $line_item->product_id,
                        'variant_id' => $line_item->variant_id,
                        'title' => $line_item->title,
                        'sku' => $line_item->sku,
                        'image' => null,
                        'quantity' => 0, // Add to it outside this condition
                    ];
                }

                $map[$line_item->product_id]['quantity'] += $line_item->quantity;
            }
        }

        $items = collect($map);

        $chunks = $items->chunk(100);
        $products = collect();

        foreach($chunks as $chunk) {
            $p_request = $shop->api()->rest('GET', '/admin/products.json',[
                'limit' => 250,
                'fields' => 'id,images,variants',
                'ids' => implode(',', $chunk->pluck('id')->toArray())
            ]);

            $new_products = collect($p_request->body->products);
            $products = $products->union($new_products->keyBy('id'));
        }


        $items->transform(function ($item) use ($products) {
            if(isset($products[$item['id']]) && isset($products[$item['id']]->images)) {
                $item['image'] = $products[$item['id']]->images[0]->src;
            }
            if(isset($products[$item['id']]) && isset($products[$item['id']]->variants)) {
                $item['price'] = $products[$item['id']]->variants[0]->price;
            }

            return $item;
        });

        return $items->values();

    }

    public function placeOrder($customer_id, Request $request)
    {
        $valid = $request->validate([
            'discount' => 'required|numeric',
            'cost' => 'required|numeric',
            'items' => 'required|min:1',
            'items.*.variant_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
        ]);


        $shop = ShopifyApp::shop();
        $s_request = $shop->api()->rest('POST', "/admin/draft_orders.json", [
            'draft_order' => [
                'line_items' => $valid['items'],
                'customer' => [
                    'id' => $customer_id
                ],
                'applied_discount' => [
                    'description' => 'Discount for wholesale customer',
                    'value_type' => 'percentage',
                    'value' => $valid['discount'],
                    'amount' => $valid['discount'] * $valid['cost'] / 100.0,
                    'title' => 'Wholesale'
                ],
            ]
        ]);

        return json_encode($s_request->body->draft_order);


    }
}
