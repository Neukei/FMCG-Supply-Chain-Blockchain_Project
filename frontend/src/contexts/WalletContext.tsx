import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  shortAddress: string;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress]       = useState<string | null>(null);
  const [chainId, setChainId]       = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask to use blockchain features.');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network  = await provider.getNetwork();
      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (e: any) {
      setError(e.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setError(null);
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const eth = window.ethereum as any;
    const onAccounts = (accs: string[]) => {
      if (accs.length === 0) disconnect();
      else setAddress(accs[0]);
    };
    const onChain = (id: string) => setChainId(parseInt(id, 16));
    eth.on?.('accountsChanged', onAccounts);
    eth.on?.('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, [disconnect]);

  // Auto-connect if already permitted
  useEffect(() => {
    if (!window.ethereum) return;
    const eth = window.ethereum as any;
    eth.request?.({ method: 'eth_accounts' }).then((accs: string[]) => {
      if (accs.length > 0) {
        setAddress(accs[0]);
        const p = new BrowserProvider(eth);
        p.getNetwork().then(n => setChainId(Number(n.chainId)));
      }
    }).catch(() => {});
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <WalletContext.Provider value={{
      address, chainId, isConnected: !!address,
      isConnecting, error, connect, disconnect, shortAddress
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
}

// Extend window type
declare global {
  interface Window {
    ethereum?: any;
  }
}
