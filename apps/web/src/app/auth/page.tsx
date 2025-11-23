"use client";

import { useMiniApp } from "@/contexts/miniapp-context";
import { useAccount, useConnect } from "wagmi";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const { isMiniAppReady } = useMiniApp();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const router = useRouter();

  // Auto-connect wallet when miniapp is ready
  useEffect(() => {
    if (isMiniAppReady && !isConnected && !isConnecting && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect]);

  // Redirect to import page when connected
  useEffect(() => {
    if (isConnected && address) {
      router.push('/import');
    }
  }, [isConnected, address, router]);

  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md mx-auto p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Auth</h1>
          
          {isConnected ? (
            <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Connected</p>
              <p className="text-sm text-gray-700 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          ) : (
            <Button
              onClick={() => {
                const farcasterConnector = connectors.find(c => c.id === 'farcaster');
                if (farcasterConnector) {
                  connect({ connector: farcasterConnector });
                }
              }}
              disabled={isConnecting}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-6 text-lg"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}

