@extends('layouts.default')

@section('content')
    <div id="app"></div>
@endsection

@section('scripts')
    @parent

    <script src="{{ mix('js/app.js') }}"></script>

    <script type="text/javascript">
        // Bar title
        window.mainPageTitle = 'Welcome Page';
    </script>
@endsection