import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [signer, setSigner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const savedAccount = localStorage.getItem('walletAddress');
    if (savedAccount) {
      setAccount(savedAccount);
      connectWallet();
    }
  }, []);

  const connectWallet = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setSigner(signer);
      setAccount(address);
      localStorage.setItem('walletAddress', address);

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountChange);

      return signer;
    } catch (error) {
      console.error('Connection error:', error);
      return null;
    }
  };

  const handleAccountChange = async (accounts) => {
    if (accounts.length === 0) {
      setAccount('');
      setSigner(null);
      localStorage.removeItem('walletAddress');
    } else {
      setAccount(accounts[0]);
      localStorage.setItem('walletAddress', accounts[0]);
      await connectWallet();
    }
  };

  return (
    <WalletContext.Provider
      value={{ account, signer, isOwner, setIsOwner, connectWallet }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
