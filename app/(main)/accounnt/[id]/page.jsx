import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import { get } from "react-hook-form";
import AccountDetailClient from "../components/account-detail-client";
import { BarLoader } from "react-spinners";

export default async function AccountDetailPage({ params }) {
    try {
        const { id } = await params;
        const accountData = await getAccountWithTransactions(id);

        if (!accountData) {
            notFound();
        }

        const { transactions, ...account } = accountData;

        return (
            <Suspense
                fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
            >
                <AccountDetailClient 
                    initialAccount={account} 
                    initialTransactions={transactions} 
                />
            </Suspense>
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
