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
    {/* Convex provider state is the source of truth for auth status; Better Auth session data fills in the user payload. */}
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <App />
    </ConvexBetterAuthProvider>
  </React.StrictMode>
);
