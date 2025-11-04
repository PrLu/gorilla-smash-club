'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

/**
 * Toast notification wrapper
 * Uses react-hot-toast with custom styling
 */
export function Toast() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          borderRadius: '0.75rem',
          padding: '1rem',
        },
        success: {
          iconTheme: {
            primary: '#16a34a',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #dcfce7',
          },
        },
        error: {
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #fee2e2',
          },
        },
        loading: {
          iconTheme: {
            primary: '#0284c7',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

