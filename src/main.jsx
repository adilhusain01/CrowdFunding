import { createRoot } from 'react-dom/client';
import './style.css';
import App from './App.jsx';
import { WalletProvider } from './contexts/WalletContext.jsx';
import { CrowdfundingProvider } from './contexts/CrowdfundingContext.jsx';

createRoot(document.getElementById('root')).render(
  <WalletProvider>
    <CrowdfundingProvider>
      <App />
    </CrowdfundingProvider>
  </WalletProvider>
);
