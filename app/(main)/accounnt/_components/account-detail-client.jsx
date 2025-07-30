"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BarLoader } from "react-spinners";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTestTransactions } from "@/actions/test-data";
import { getTransactionsPage } from "@/actions/pagination";
import TransactionTable from "./transaction-table";
import Pagination from "@/components/pagination";

const AccountDetailClient = ({ initialAccount, initialTransactions, initialPagination }) => {
    const searchParams = useSearchParams();
    const [account, setAccount] = useState(initialAccount);
    const [transactions, setTransactions] = useState(initialTransactions);
    const [pagination, setPagination] = useState(initialPagination);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connected');

    // Calculate transaction count from pagination or local data
    const transactionCount = pagination?.totalTransactions || transactions.length;

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

            // Update pagination total when transactions change
            if (pagination) {
                setPagination(prev => ({
                    ...prev,
                    totalTransactions: Math.max(0, prev.totalTransactions + (updatedTransactions.length - transactions.length))
                }));
            }
        } catch (err) {
            setError('Failed to update transaction. Please try again.');
            console.error('Transaction update error:', err);
        }
        
        // Reset loading after a short delay
        setTimeout(() => setIsLoading(false), 200);
    }, [isLoading, transactions.length, pagination]);

    const handlePageChange = useCallback(async (newPage) => {
        // Prevent navigation if already loading
        if (isLoading) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const currentLimit = pagination?.limit || 10;
            const result = await getTransactionsPage(account.id, newPage, currentLimit);
            
            if (result.success) {
                // Update URL without triggering page reload
                const params = new URLSearchParams(window.location.search);
                params.set('page', newPage.toString());
                params.set('limit', currentLimit.toString());
                window.history.pushState({}, '', `?${params.toString()}`);
                
                // Update state with new data
                setTransactions(result.data.transactions);
                setPagination(result.data.pagination);
            } else {
                setError(result.error || 'Failed to load page');
            }
        } catch (error) {
            console.error('Page change error:', error);
            setError('Failed to load page. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [account.id, pagination?.limit, isLoading]);

    const handlePageSizeChange = useCallback(async (newLimit) => {
        if (isLoading) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await getTransactionsPage(account.id, 1, newLimit); // Reset to page 1 when changing size
            
            if (result.success) {
                // Update URL without triggering page reload
                const params = new URLSearchParams(window.location.search);
                params.set('page', '1');
                params.set('limit', newLimit.toString());
                window.history.pushState({}, '', `?${params.toString()}`);
                
                // Update state with new data
                setTransactions(result.data.transactions);
                setPagination(result.data.pagination);
            } else {
                setError(result.error || 'Failed to change page size');
            }
        } catch (error) {
            console.error('Page size change error:', error);
            setError('Failed to change page size. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [account.id, isLoading]);

    const handleCreateTestData = useCallback(async () => {
        if (window.confirm('Create 150 test transactions? This will provide daily data for chart visualization.')) {
            setIsLoading(true);
            try {
                await createTestTransactions(account.id, 150);
                window.location.reload(); // Reload to show new data
            } catch (error) {
                setError('Failed to create test data');
                setIsLoading(false);
            }
        }
    }, [account.id]);

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
                    {/* Temporary test button - remove in production */}
                    {transactionCount < 150 && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCreateTestData}
                            className="mt-2"
                        >
                            Add Test Data (150)
                        </Button>
                    )}
                </div>
            </div>
            {/* Transaction Table */}
            <TransactionTable 
                transactions={transactions} 
                onTransactionUpdate={handleTransactionUpdate}
                isPaginated={!!pagination}
            />

            {/* Pagination */}
            {pagination && pagination.totalTransactions > 0 && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalTransactions={pagination.totalTransactions}
                    limit={pagination.limit}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            )}
        </div>
    );
};

export default AccountDetailClient;
