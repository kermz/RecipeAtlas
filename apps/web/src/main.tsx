import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import '@fontsource/jetbrains-mono';
import { App } from './App';
import { authClient } from './lib/auth-client';
import { convex } from './lib/convex-client';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <App />
    </ConvexBetterAuthProvider>
  </React.StrictMode>
);
