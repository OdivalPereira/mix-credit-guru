import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * @description Um componente de limite de erro React que captura erros de JavaScript em qualquer lugar em sua árvore de componentes filho,
 * registra esses erros e exibe uma interface do usuário de fallback em vez da árvore de componentes que travou.
 * @param props As props para o componente.
 * @param props.children Os componentes filho a serem renderizados dentro do limite de erro.
 * @param props.fallback Um componente de fallback opcional para renderizar quando um erro é capturado.
 * @param props.onError Um manipulador de erro opcional para chamar quando um erro é capturado.
 * @returns O componente ErrorBoundary.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Algo deu errado</CardTitle>
                  <CardDescription>
                    Ocorreu um erro inesperado na aplicacao
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Detalhes do erro:
                  </h4>
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-sm font-mono text-foreground">
                      {this.state.error.toString()}
                    </p>
                  </div>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
                    Stack trace (desenvolvimento)
                  </summary>
                  <div className="mt-2 rounded-md bg-muted p-4">
                    <pre className="text-xs font-mono text-foreground overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset}>
                  Tentar novamente
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Recarregar pagina
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
