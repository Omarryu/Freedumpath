import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminPanel from './components/AdminPanel';
import './index.css';

const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminPanel /> : <App />}
  </React.StrictMode>
);
