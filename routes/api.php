<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('customers', 'CustomerController@search');
Route::get('customers/{customer_id}/orders', 'CustomerController@orders');
Route::post('customers/{customer_id}/orders', 'CustomerController@placeOrder');