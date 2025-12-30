<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>405 - Method Not Allowed | {{ config('app.name', 'Amanah Support') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }

        .container {
            max-width: 480px;
            width: 100%;
        }

        .card {
            background: white;
            border-radius: 1.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
            padding: 3rem 2rem;
            text-align: center;
        }

        .icon-wrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 5rem;
            height: 5rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            margin-bottom: 1rem;
        }

        .icon-wrapper svg {
            width: 2.5rem;
            height: 2.5rem;
            color: white;
        }

        .code {
            font-size: 4.5rem;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1;
            margin-bottom: 0.5rem;
        }

        .title {
            font-size: 1.25rem;
            font-weight: 600;
            color: white;
        }

        .body {
            padding: 2rem;
            text-align: center;
        }

        .description {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
            border: none;
            font-size: 0.875rem;
        }

        .btn-outline {
            background: transparent;
            border: 1px solid #e2e8f0;
            color: #475569;
        }

        .btn-outline:hover {
            background: #f8fafc;
        }

        .btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .footer {
            text-align: center;
            margin-top: 1.5rem;
        }

        .footer a {
            color: #6366f1;
            text-decoration: none;
            font-weight: 500;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        .footer span {
            color: #94a3b8;
            font-size: 0.875rem;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <div class="code">405</div>
                <div class="title">{{ __('Method Not Allowed') }}</div>
            </div>
            <div class="body">
                <p class="description">
                    {{ __('The request method is not supported for this resource. Please try a different approach.') }}
                </p>
                <div class="actions">
                    <button onclick="history.back()" class="btn btn-outline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m12 19-7-7 7-7" />
                            <path d="M19 12H5" />
                        </svg>
                        {{ __('Go Back') }}
                    </button>
                    <a href="/" class="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        {{ __('Back to Home') }}
                    </a>
                </div>
            </div>
        </div>
        <div class="footer">
            <span>{{ __('Need help?') }} </span>
            <a href="/">{{ __('Contact Support') }}</a>
        </div>
    </div>
</body>

</html>