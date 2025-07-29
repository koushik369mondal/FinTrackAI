"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BarLoader } from "react-spinners";
import TransactionTable from "./transaction-table";

const AccountDetailClient = ({ initialAccount, initialTransactions }) => {
    const [account, setAccount] = useState(initialAccount);
    const [transactions, setTransactions] = useState(initialTransactions);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connected');

    // Calculate transaction count dynamically instead of useEffect
    const transactionCount = transactions.length;

    const handleTransactionUpdate = useCallback((updatedTransactions, balanceChange = 0) => {
        // Prevent rapid successive updates
        if (isLoading) return;
        
        setIsLoading(true);
        setError(null); // Clear any previous errors
        
        try {
            // Use a more defensive approach to state updates
            setTransactions(prevTransactions => {
                // Ensure we have valid data
                if (!Array.isArray(updatedTransactions)) {
                    console.warn('Invalid transactions data received:', updatedTransactions);
                    return prevTransactions;
                }
                return updatedTransactions;
            });
            
            if (balanceChange !== 0 && !isNaN(balanceChange)) {
                setAccount(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        balance: Number((parseFloat(prev.balance) + balanceChange).toFixed(2))
                    };
                });
            }
        } catch (err) {
            setError('Failed to update transaction. Please try again.');
            console.error('Transaction update error:', err);
        }
        
        // Reset loading after a short delay
        setTimeout(() => setIsLoading(false), 200);
    }, [isLoading]);

    // Monitor for connection issues
    useEffect(() => {
        const handleOnline = () => {
            setConnectionStatus('connected');
            setError(null);
        };

        const handleOffline = () => {
            setConnectionStatus('disconnected');
            setError('Connection lost. Please check your internet connection.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial connection status
        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="space-y-8 px-5">
            {/* Connection status indicator */}
            {connectionStatus === 'disconnected' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <span className="text-yellow-700 text-sm font-medium">⚠️ Connection unstable</span>
                </div>
            )}

            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <span className="text-red-700 text-sm">{error}</span>
                    <button 
                        onClick={() => setError(null)} 
                        className="ml-2 text-red-600 hover:text-red-800 underline text-sm"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {isLoading && (
                <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
            )}
            <div className="flex gap-4 items-end justify-between">
                <div>
                    <h1 className="text-5xl sm:text-6xl font-bold gradient-title capitalize">
                        {account.name}
                    </h1>
                    <p className="text-muted-foreground">
                        {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
                    </p>
                </div>

                <div className="text-right pb-2">
                    <div className="text-xl sm:text-2xl font-bold">
                        ${parseFloat(account.balance).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {transactionCount} Transactions
                    </p>
                </div>
            </div>
            {/* Chart Section */}

            {/* Transaction Table */}
            <TransactionTable 
                transactions={transactions} 
                onTransactionUpdate={handleTransactionUpdate}
            />
        </div>
    );
};

export default AccountDetailClient;
