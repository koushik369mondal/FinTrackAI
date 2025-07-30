import { getAccountWithTransactions, getAllTransactionsForChart } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import AccountDetailClient from "../_components/account-detail-client";
import AccountChart from "../_components/account-chart";
import { BarLoader } from "react-spinners";

export default async function AccountDetailPage({ params, searchParams }) {
    try {
        const { id } = await params;
        const { page = '1', limit = '10' } = await searchParams || {}; // Changed to 10 transactions per page as default

        const currentPage = parseInt(page);
        const pageLimit = parseInt(limit);

        // Get paginated transactions for the table
        const accountData = await getAccountWithTransactions(id, currentPage, pageLimit);
        
        // Get all transactions for the chart
        const allTransactions = await getAllTransactionsForChart(id);

        if (!accountData) {
            notFound();
        }

        const { transactions, pagination, ...account } = accountData;

        return (
            <div className="space-y-8">
                {/* Chart Section */}
                <Suspense
                    fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
                >
                    <AccountChart transactions={allTransactions} />
                </Suspense>

                {/* Transaction Table */}
                <Suspense
                    fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
                >
                    <AccountDetailClient
                        initialAccount={account}
                        initialTransactions={transactions}
                        initialPagination={pagination}
                    />
                </Suspense>
            </div>
        );
    } catch (error) {
        console.error('Error loading account data:', error);
        return (
            <div className="space-y-8 px-5">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Error Loading Account</h1>
                    <p className="text-gray-600">Please try refreshing the page</p>
                </div>
            </div>
        );
    }
}
