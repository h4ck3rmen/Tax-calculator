import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

window.addEventListener('error', function(e) {
  const root = document.getElementById('root');
  if (root) {
    // only show if it's completely blank
    if (root.innerHTML === '') {
      root.innerHTML = '<div style="padding:20px;color:red;font-family:sans-serif">' +
        '<h2>Runtime Error</h2>' + 
        '<p>' + e.message + '</p>' +
        '<pre>' + e.error?.stack + '</pre>' + 
        '</div>';
    }
  }
});

