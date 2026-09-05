import React from 'react';
import { AlertTriangle } from 'lucide-react';

// React error boundaries must be class components (no hook equivalent exists
// as of React 19). This is the last line of defense: if any render throws
// (e.g. an unexpected API response shape), show a recoverable message
// instead of unmounting the whole app to a blank/black screen.
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('Unhandled render error:', error, info);
    }

    handleReset = () => {
        this.setState({ error: null });
    };

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-[#0c0c0e] text-[#e2e2e7] flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <AlertTriangle className="text-red-400" size={32} />
                    <p className="text-sm font-semibold">Something went wrong while rendering.</p>
                    <p className="text-xs text-gray-500 max-w-sm break-words">{this.state.error?.message || String(this.state.error)}</p>
                    <button
                        onClick={this.handleReset}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-xs transition-colors"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
