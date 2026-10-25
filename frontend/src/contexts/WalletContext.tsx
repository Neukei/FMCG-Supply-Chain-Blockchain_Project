import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

export interface DemoActor {
  key: string;
  name: string;
  role: string;
  company: string;
  address: string;
}

export const DEMO_ACTORS: Record<string, DemoActor> = {
  MANUFACTURER: {
    key: 'MANUFACTURER',
    name: 'Elena Rostova',
    role: 'MANUFACTURER',
    company: 'Apex Beverages Ltd',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
  DISTRIBUTOR: {
    key: 'DISTRIBUTOR',
    name: 'Marcus Vance',
    role: 'DISTRIBUTOR',
    company: 'TransGlobal Freight',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  },
  WAREHOUSE: {
    key: 'WAREHOUSE',
    name: 'Sarah Chen',
    role: 'WAREHOUSE',
    company: 'Central Hub #4',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  },
  RETAILER: {
    key: 'RETAILER',
    name: 'Rajesh Kumar',
    role: 'RETAILER',
    company: 'Metro Supermarkets',
    address: '0x15d34AAf5477673822059258474F761d40026b4f',
  },
  ADMIN: {
    key: 'ADMIN',
    name: 'System Admin',
    role: 'ADMIN',
    company: 'Global FMCG Standards Authority',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
};

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  shortAddress: string;
  activeActor: DemoActor | null;
  switchActor: (roleKey: string) => void;
  isDemoMode: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress]       = useState<string | null>(DEMO_ACTORS.MANUFACTURER.address);
  const [chainId, setChainId]       = useState<number | null>(31337);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [activeActor, setActiveActor] = useState<DemoActor | null>(DEMO_ACTORS.MANUFACTURER);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Defaulting to Demo Actor Mode.');
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
      setActiveActor(null);
      setIsDemoMode(false);
    } catch (e: any) {
      setError(e.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchActor = useCallback((roleKey: string) => {
    const actor = DEMO_ACTORS[roleKey];
    if (actor) {
      setAddress(actor.address);
      setChainId(31337);
      setActiveActor(actor);
      setIsDemoMode(true);
      setError(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setActiveActor(null);
    setIsDemoMode(false);
    setError(null);
  }, []);

  // Listen for MetaMask account/chain changes if connected to MetaMask
  useEffect(() => {
    if (!window.ethereum) return;
    const eth = window.ethereum as any;
    const onAccounts = (accs: string[]) => {
      if (accs.length === 0) {
        if (!isDemoMode) disconnect();
      } else if (!isDemoMode) {
        setAddress(accs[0]);
      }
    };
    const onChain = (id: string) => {
      if (!isDemoMode) setChainId(parseInt(id, 16));
    };
    eth.on?.('accountsChanged', onAccounts);
    eth.on?.('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, [disconnect, isDemoMode]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <WalletContext.Provider value={{
      address, chainId, isConnected: !!address,
      isConnecting, error, connect, disconnect, shortAddress,
      activeActor, switchActor, isDemoMode,
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

declare global {
  interface Window {
    ethereum?: any;
  }
}
