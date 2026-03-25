import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Domain-based branding
if (window.location.hostname === 'mynelo.in' || window.location.hostname === 'www.mynelo.in') {
  document.title = 'MYNELO';
  const favicon = document.querySelector("link[rel='icon']");
  if (favicon) {
    favicon.href = '/images/favi.png';
  } else {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = '/images/favi.png';
    document.head.appendChild(link);
  }
}
import reportWebVitals from './reportWebVitals';
import "bootstrap/dist/css/bootstrap.min.css"

import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="918963755186-1to7blefh93j9k6lgfmuhgmi28oumf14.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();