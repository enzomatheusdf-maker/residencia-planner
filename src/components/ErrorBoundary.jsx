import React from "react";
import { AlertCircle, Download, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (this.props?.onError) {
      this.props.onError(error);
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 flex flex-col gap-3 text-left">
        <div className="flex items-center gap-2 text-red-300">
          <AlertCircle size={18} />
          <h3 className="text-sm font-black">Algo deu errado nesta tela.</h3>
        </div>
        <p className="text-[12px] text-red-100/90">
          Voce pode recarregar este modulo, voltar ao Dashboard ou exportar backup.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <pre className="max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/35 p-3 text-[10px] text-red-200 whitespace-pre-wrap">
            {String(error?.stack || error?.message || error)}
          </pre>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} /> Recarregar
          </button>
          {this.props?.onExportBackup && (
            <button
              type="button"
              onClick={this.props.onExportBackup}
              className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/25 text-blue-100 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} /> Exportar backup
            </button>
          )}
          {this.props?.onBackToDashboard && (
            <button
              type="button"
              onClick={this.props.onBackToDashboard}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[11px] font-bold cursor-pointer"
            >
              Voltar ao Dashboard
            </button>
          )}
        </div>
      </section>
    );
  }
}
