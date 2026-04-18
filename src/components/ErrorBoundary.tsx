import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional friendly label of the area that crashed (shown in fallback UI). */
  context?: string;
  /** Optional fully custom fallback. If provided, replaces the default UI. */
  fallback?: ReactNode;
  /** Optional callback so parents can react (close modal, reset state, telemetry). */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Optional reset callback rendered as a "Try again" button. */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary defensivo para evitar a "Tela Preta da Morte" no React.
 *
 * Sem ErrorBoundary, qualquer exceção durante render desmonta a árvore inteira,
 * deixando o `<div id="root" />` vazio — e em iOS isso aparece como uma tela
 * 100% escura (apenas a barra de status visível). Esse componente captura o
 * erro, mostra um fallback amigável e permite ao usuário tentar de novo
 * sem precisar fechar o app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log para o console — útil em dev e nas ferramentas de debug do Lovable.
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.context ? ` · ${this.props.context}` : ''}]`, error, info);
    this.props.onError?.(error, info);
  }

  componentDidMount() {
    // Captura erros assíncronos (edge functions, fetch, supabase.invoke etc.)
    // que escapam do ciclo de render do React e normalmente causariam tela em branco.
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleWindowError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleWindowError);
  }

  private isFatal(message: string): boolean {
    // Só promovemos a fallback global erros que realmente quebrariam a UI.
    // Falhas de rede pontuais (uma chamada Supabase) não devem derrubar o app inteiro.
    const fatalSignals = [
      'ChunkLoadError',
      'Loading chunk',
      'Loading CSS chunk',
      'Failed to fetch dynamically imported module',
      'Importing a module script failed',
    ];
    return fatalSignals.some((s) => message.includes(s));
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const error =
      reason instanceof Error
        ? reason
        : new Error(typeof reason === 'string' ? reason : 'Erro inesperado em operação assíncrona.');
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.context ? ` · ${this.props.context}` : ''}] unhandledrejection`, error);
    if (this.isFatal(error.message)) {
      event.preventDefault();
      this.setState({ hasError: true, error });
    }
  };

  handleWindowError = (event: ErrorEvent) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message || 'Erro inesperado.');
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.context ? ` · ${this.props.context}` : ''}] window.error`, error);
    if (this.isFatal(error.message)) {
      this.setState({ hasError: true, error });
    }
  };

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return <>{this.props.fallback}</>;

    const message = this.state.error?.message || 'Erro inesperado.';

    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center px-4 py-10 bg-background text-foreground">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-foreground/80" aria-hidden="true" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1">
            Algo travou por aqui
          </h2>
          {this.props.context && (
            <p className="text-xs text-muted-foreground mb-2">{this.props.context}</p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed mb-5 break-words">
            Recarregamos esta área para você. Se acontecer de novo, volte para a tela inicial e tente abrir novamente.
          </p>
          <details className="text-left text-[11px] text-muted-foreground/80 mb-5 select-text">
            <summary className="cursor-pointer hover:text-foreground transition-colors">Detalhes técnicos</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words bg-muted/50 rounded-md p-2 max-h-40 overflow-auto">
              {message}
            </pre>
          </details>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.reset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
