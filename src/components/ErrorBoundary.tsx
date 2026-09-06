import React from 'react';

interface State { hasError: boolean; }
interface Props { children: React.ReactNode; onReset: () => void; }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm mb-6">Your saved game data may be corrupted. Starting a new game will fix this.</p>
            <button
              onClick={() => { this.props.onReset(); this.setState({ hasError: false }); }}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all hover:scale-105"
            >
              Start New Game
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
