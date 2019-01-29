<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="shopify-api-key" content="{{ config('shopify-app.api_key') }}">
    <meta name="shopify-shop-origin" content="{{ ShopifyApp::shop()->shopify_domain }}">
    @if(config('app.env') == 'local')
        <meta name="app-debug" content="true">
    @endif

    <title>{{ config('shopify-app.app_name') }}</title>

    @yield('styles')
</head>

<body>
<div class="app-wrapper">
    <div class="app-content">
        <main role="main">
            @yield('content')
        </main>
    </div>
</div>

@if(config('shopify-app.esdk_enabled'))
    @include('shopify-app::partials.flash_messages')
@endif

@yield('scripts')
</body>
</html>