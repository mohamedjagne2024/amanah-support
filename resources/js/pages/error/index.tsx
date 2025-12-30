import { Link } from '@inertiajs/react';
import { Fragment, ReactNode } from 'react';
import {
  AlertCircle,
  ShieldOff,
  FileQuestion,
  Clock,
  ServerCrash,
  ServerOff,
  ArrowLeft,
  Home,
  RefreshCw,
} from 'lucide-react';
import PageMeta from '@/components/PageMeta';

interface ErrorPageProps {
  status: number;
  message?: string;
}

type ErrorDetails = {
  title: string;
  code: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  suggestion?: string;
};

const getErrorDetails = (status: number): ErrorDetails => {
  switch (status) {
    case 400:
      return {
        title: 'Bad Request',
        code: '400',
        description: 'The request you made was invalid. Please check your input and try again.',
        icon: AlertCircle,
        gradient: 'from-orange-500 to-amber-500',
        iconBg: 'bg-orange-500/10 text-orange-500',
        suggestion: 'Check the URL or form data and try again.',
      };
    case 403:
      return {
        title: 'Access Forbidden',
        code: '403',
        description: "You don't have permission to access this resource. Please contact your administrator if you believe this is an error.",
        icon: ShieldOff,
        gradient: 'from-red-500 to-rose-500',
        iconBg: 'bg-red-500/10 text-red-500',
        suggestion: 'Contact support if you need access to this page.',
      };
    case 404:
      return {
        title: 'Page Not Found',
        code: '404',
        description: "The page you're looking for doesn't exist or has been moved to a different location.",
        icon: FileQuestion,
        gradient: 'from-blue-500 to-indigo-500',
        iconBg: 'bg-blue-500/10 text-blue-500',
        suggestion: 'Check the URL or navigate using the menu.',
      };
    case 405:
      return {
        title: 'Method Not Allowed',
        code: '405',
        description: 'The request method is not supported for this resource.',
        icon: AlertCircle,
        gradient: 'from-purple-500 to-violet-500',
        iconBg: 'bg-purple-500/10 text-purple-500',
        suggestion: 'Try navigating to this page using a different method.',
      };
    case 419:
      return {
        title: 'Session Expired',
        code: '419',
        description: 'Your session has expired. Please refresh the page and try again.',
        icon: Clock,
        gradient: 'from-yellow-500 to-orange-500',
        iconBg: 'bg-yellow-500/10 text-yellow-500',
        suggestion: 'Refresh the page to get a new session token.',
      };
    case 500:
      return {
        title: 'Server Error',
        code: '500',
        description: 'Something went wrong on our servers. Our team has been notified and is working on it.',
        icon: ServerCrash,
        gradient: 'from-red-600 to-pink-600',
        iconBg: 'bg-red-500/10 text-red-500',
        suggestion: 'Try again later or contact support if the problem persists.',
      };
    case 503:
      return {
        title: 'Service Unavailable',
        code: '503',
        description: 'We\'re currently performing maintenance. Please check back soon.',
        icon: ServerOff,
        gradient: 'from-slate-500 to-gray-600',
        iconBg: 'bg-slate-500/10 text-slate-500',
        suggestion: 'We\'ll be back shortly. Thank you for your patience.',
      };
    default:
      return {
        title: 'Something Went Wrong',
        code: String(status),
        description: 'An unexpected error occurred. Please try again later.',
        icon: AlertCircle,
        gradient: 'from-gray-500 to-slate-600',
        iconBg: 'bg-gray-500/10 text-gray-500',
        suggestion: 'Try refreshing the page or contact support.',
      };
  }
};

function Page({ status, message }: ErrorPageProps) {
  const errorDetails = getErrorDetails(status);
  const IconComponent = errorDetails.icon;

  return (
    <>
      <PageMeta title={`${errorDetails.code} - ${errorDetails.title}`} />
      
      <div className="min-h-screen bg-default-50 flex items-center justify-center px-4 py-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br ${errorDetails.gradient} opacity-10 blur-3xl`} />
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr ${errorDetails.gradient} opacity-10 blur-3xl`} />
        </div>

        <div className="relative w-full max-w-lg">
          {/* Main Card */}
          <div className="card overflow-hidden">
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${errorDetails.gradient} px-8 py-10 text-center`}>
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <IconComponent className="size-10 text-white" />
              </div>
              <h1 className="text-7xl font-bold text-white/90 mb-2">{errorDetails.code}</h1>
              <h2 className="text-xl font-semibold text-white">{errorDetails.title}</h2>
            </div>

            {/* Content */}
            <div className="card-body text-center">
              <p className="text-default-600 leading-relaxed mb-4">
                {message || errorDetails.description}
              </p>
              
              {errorDetails.suggestion && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-default-100 text-default-600 text-sm mb-6">
                  <AlertCircle className="size-4" />
                  {errorDetails.suggestion}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                  onClick={() => window.history.back()} 
                  className="btn border-default-200 text-default-700 hover:bg-default-100 w-full sm:w-auto"
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Go Back
                </button>
                
                {status === 419 ? (
                  <button 
                    onClick={() => window.location.reload()} 
                    className="btn bg-primary text-white w-full sm:w-auto"
                  >
                    <RefreshCw className="size-4 mr-2" />
                    Refresh Page
                  </button>
                ) : (
                  <Link 
                    href="/" 
                    className="btn bg-primary text-white w-full sm:w-auto"
                  >
                    <Home className="size-4 mr-2" />
                    Back to Home
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Support Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-default-500">
              Need help?{' '}
              <Link href="/" className="text-primary hover:underline font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Use a fragment layout since error pages should be standalone
Page.layout = (page: ReactNode) => <Fragment>{page}</Fragment>;

export default Page;
