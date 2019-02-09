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
    <link rel="stylesheet" href="https://sdks.shopifycdn.com/polaris/3.0.0/polaris.min.css" />
    <title>{{ config('shopify-app.app_name') }}</title>

    @yield('styles')
</head>

<body>
    @yield('content')
</div>

@if(config('shopify-app.esdk_enabled'))
    @include('shopify-app::partials.flash_messages')
@endif

@yield('scripts')
</body>
</html>