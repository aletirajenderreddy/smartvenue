import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className='grid min-h-screen place-items-center p-4'>
          <section className='max-w-md rounded-lg border border-danger/30 bg-danger/15 p-5 text-center'>
            <h1 className='font-heading text-2xl font-bold'>Something went wrong</h1>
            <p className='mt-2 text-sm text-white/75'>Refresh the app or return to the venue help desk if this happens during entry.</p>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
