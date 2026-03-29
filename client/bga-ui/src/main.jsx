import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import BusinessPage from './BusinessPage.jsx';
import Dashboard from './Dashboard.jsx';

const path = window.location.pathname;
const isHome = path === '/' || path === '';
const isDashboard = path === '/dashboard';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDashboard ? <Dashboard /> : isHome ? <App /> : <BusinessPage />}
  </StrictMode>
);
