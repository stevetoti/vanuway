import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Wifi } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isChunkError: boolean;
}

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message || '';
  return (
    error.name === 'ChunkLoadError' ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Auto-recover from chunk load errors — reload to get fresh code
    if (isChunkLoadError(error)) {
      const hasRetried = sessionStorage.getItem('error_boundary_retry');
      if (!hasRetried) {
        sessionStorage.setItem('error_boundary_retry', '1');
        // Small delay so user sees "Updating..." briefly
        setTimeout(() => window.location.reload(), 500);
        return;
      }
      // Already retried once — show the error UI
      sessionStorage.removeItem('error_boundary_retry');
    }
  }

  handleReload = () => {
    sessionStorage.removeItem('error_boundary_retry');
    sessionStorage.removeItem('chunk_retry');
    window.location.reload();
  };

  handleGoHome = () => {
    sessionStorage.removeItem('error_boundary_retry');
    sessionStorage.removeItem('chunk_retry');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Chunk error — show a friendlier "updating" message
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="max-w-sm w-full">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
                <h2 className="text-lg font-bold mb-2">App Updated</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  A new version of VanuWay is available. Refreshing to load the latest version.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2" onClick={this.handleReload}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button className="flex-1 gap-2" onClick={this.handleGoHome}>
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Generic error
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>

              <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mb-5">
                We're sorry for the inconvenience. Please try again.
              </p>

              {this.state.error && (
                <details className="text-left mb-4 p-3 bg-gray-50 rounded-lg border">
                  <summary className="cursor-pointer text-xs font-semibold text-gray-500">
                    Error Details
                  </summary>
                  <pre className="text-[10px] overflow-auto text-red-600 whitespace-pre-wrap mt-2">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={this.handleReload}>
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button className="flex-1 gap-2" onClick={this.handleGoHome}>
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground mt-4">
                If this persists, contact{' '}
                <a href="mailto:support@vanuway.com" className="text-primary hover:underline">
                  support@vanuway.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
