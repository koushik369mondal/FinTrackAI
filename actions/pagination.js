"use server";

import { getTransactionsPaginated } from "./accounts";

export async function getTransactionsPage(accountId, page, limit, filters = {}) {
    try {
        const result = await getTransactionsPaginated(accountId, page, limit, filters);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error fetching transactions page:', error);
        return {
            success: false,
            error: error.message || "Failed to fetch transactions"
        };
    }
}
