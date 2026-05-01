// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './services/queryClient';

//Prevent mouse-wheel from accidentally changing
//    <input type="number"> values globally — affects SKS qty inputs,
//    Record-Payment amount, rate-chart inputs, etc.
document.addEventListener('wheel', () => {
  if (document.activeElement?.type === 'number') {
    document.activeElement.blur()
  }
}, { passive: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)