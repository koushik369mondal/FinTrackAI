"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { dbMonitor } from "@/lib/db-monitor";

// Database retry logic with improved error handling
async function retryDatabase(fn, maxRetries = 3, delay = 1000) {
  return await dbMonitor.retryOperation(fn, maxRetries);
}

const serializeTransaction = (obj) => {
    const serialized = { ...obj };

    if (obj.balance) {
        serialized.balance = obj.balance.toNumber();
    }

    if (obj.amount) {
        serialized.amount = obj.amount.toNumber();
    }

    return serialized;
};

export async function updateDefaultAccount(accountId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // First, verify the account exists and belongs to the user
        const targetAccount = await db.account.findFirst({
            where: {
                id: accountId,
                userId: user.id,
            },
        });

        if (!targetAccount) {
            throw new Error("Account not found");
        }

        // Use a transaction to ensure consistency
        const result = await db.$transaction(async (tx) => {
            // First, unset all default accounts for this user
            await tx.account.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false },
            });

            // Then set the target account as default
            const updatedAccount = await tx.account.update({
                where: {
                    id: accountId,
                    userId: user.id,
                },
                data: {
                    isDefault: true,
                },
            });

            return updatedAccount;
        });

        revalidatePath("/dashboard");
        return { success: true, data: serializeTransaction(result) };
    } catch (error) {
        console.error("Error updating default account:", error);
        return {
            success: false,
            error: error.message || "Failed to update default account",
        };
    }
}

export async function getAccountWithTransactions(accountId, page = 1, limit = 10) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        return await retryDatabase(async () => {
            const user = await db.user.findUnique({
                where: { clerkUserId: userId },
            });

            if (!user) {
                throw new Error("User not found");
            }

            const skip = (page - 1) * limit;
            
            // If limit is very high (like 1000 for "All"), just get all transactions
            const shouldPaginate = limit < 1000;

            // Get account with transaction count and paginated transactions
            const [account, totalTransactions] = await Promise.all([
                db.account.findUnique({
                    where: {
                        id: accountId,
                        userId: user.id,
                    },
                    include: {
                        transactions: {
                            orderBy: { date: "desc" },
                            ...(shouldPaginate ? { skip, take: limit } : {}),
                        },
                    },
                }),
                db.transaction.count({
                    where: {
                        accountId,
                        userId: user.id,
                    },
                }),
            ]);
            
            if (!account) return null;

            const totalPages = shouldPaginate ? Math.ceil(totalTransactions / limit) : 1;

            console.log('Pagination data:', {
                page,
                limit,
                totalTransactions,
                totalPages,
                accountId,
                transactionsReturned: account.transactions.length,
                shouldPaginate
            });

            return {
                ...serializeTransaction(account),
                transactions: account.transactions.map(serializeTransaction),
                pagination: {
                    currentPage: shouldPaginate ? page : 1,
                    totalPages,
                    totalTransactions,
                    hasNextPage: shouldPaginate ? (page < totalPages) : false,
                    hasPreviousPage: shouldPaginate ? (page > 1) : false,
                    limit,
                },
            };
        });
    } catch (error) {
        console.error('Error in getAccountWithTransactions:', error);
        throw error;
    }
}

export async function getAllTransactionsForChart(accountId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        return await retryDatabase(async () => {
            const user = await db.user.findUnique({
                where: { clerkUserId: userId },
            });

            if (!user) {
                throw new Error("User not found");
            }

            // Get all transactions for the account (for chart visualization)
            const transactions = await db.transaction.findMany({
                where: {
                    accountId,
                    userId: user.id,
                },
                orderBy: { date: "desc" },
            });

            return transactions.map(serializeTransaction);
        });
    } catch (error) {
        console.error('Error in getAllTransactionsForChart:', error);
        throw error;
    }
}

export async function bulkDeleteTransactions(transactionIds) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const transactions = await db.transaction.findMany({
            where: {
                id: { in: transactionIds },
                userId: user.id,
            },
        });

        const accountBalanceChanges = transactions.reduce((acc, transaction) => {
            const change =
                transaction.type === "EXPENSE"
                    ? transaction.amount
                    : -transaction.amount;

            acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
            return acc;
        }, {});

        //Delete transactions and update account balances in a transaction
        await db.$transaction(async (tx) => {
            //Delete transactions
            await tx.transaction.deleteMany({
                where: {
                    id: { in: transactionIds },
                    userId: user.id,
                },
            });

            for (const [accountId, balanceChange] of Object.entries(
                accountBalanceChanges
            )) {
                await tx.account.update({
                    where: {id: accountId},
                    data: {
                        balance: {
                            increment: balanceChange,
                        },
                    },
                });
            }
        });

        revalidatePath("/dashboard");
        
        // Revalidate all affected account pages
        for (const accountId of Object.keys(accountBalanceChanges)) {
            revalidatePath(`/accounnt/${accountId}`, "page");
        }

        return { success: true, message: "Transactions deleted successfully" };
    } catch (error) {
        return {
            success: false,
            error: error.message || "Failed to delete transactions",
        };
    }
}

export async function deleteTransaction(transactionId) {
    try {
        console.log('Delete transaction called with ID:', transactionId);
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const result = await retryDatabase(async () => {
            const user = await db.user.findUnique({
                where: { clerkUserId: userId },
            });

            if (!user) {
                throw new Error("User not found");
            }

            // Find the transaction to get its details before deletion
            const transaction = await db.transaction.findFirst({
                where: {
                    id: transactionId,
                    userId: user.id,
                },
            });

            if (!transaction) {
                throw new Error("Transaction not found");
            }

            console.log('Found transaction to delete:', transaction);

            // Calculate balance change
            const balanceChange =
                transaction.type === "EXPENSE"
                    ? transaction.amount
                    : -transaction.amount;

            console.log('Balance change:', balanceChange, 'for transaction type:', transaction.type, 'amount:', transaction.amount);

            // Delete transaction and update account balance in a transaction
            return await db.$transaction(async (tx) => {
                // Delete the transaction
                const deletedTransaction = await tx.transaction.delete({
                    where: {
                        id: transactionId,
                    },
                });

                // Update account balance
                const updatedAccount = await tx.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        balance: {
                            increment: balanceChange,
                        },
                    },
                });

                console.log('Updated account balance to:', updatedAccount.balance);
                return { deletedTransaction, updatedAccount, transaction };
            });
        });

        console.log('Transaction deleted successfully, result:', result);

        revalidatePath("/dashboard");
        revalidatePath(`/accounnt/${result.transaction.accountId}`, "page");

        return { success: true, message: "Transaction deleted successfully" };
    } catch (error) {
        console.error('Delete transaction error:', error);
        return {
            success: false,
            error: error.message || "Failed to delete transaction",
        };
    }
}

export async function getTransactionsPaginated(accountId, page = 1, limit = 10, filters = {}) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        return await retryDatabase(async () => {
            const user = await db.user.findUnique({
                where: { clerkUserId: userId },
            });

            if (!user) {
                throw new Error("User not found");
            }

            const skip = (page - 1) * limit;
            
            // Build where clause based on filters
            const whereClause = {
                accountId,
                userId: user.id,
            };

            if (filters.type) {
                whereClause.type = filters.type;
            }

            if (filters.isRecurring !== undefined) {
                whereClause.isRecurring = filters.isRecurring;
            }

            if (filters.search) {
                whereClause.description = {
                    contains: filters.search,
                    mode: 'insensitive',
                };
            }

            const [transactions, totalTransactions] = await Promise.all([
                db.transaction.findMany({
                    where: whereClause,
                    orderBy: { date: "desc" },
                    skip,
                    take: limit,
                }),
                db.transaction.count({
                    where: whereClause,
                }),
            ]);

            const totalPages = Math.ceil(totalTransactions / limit);

            return {
                transactions: transactions.map(serializeTransaction),
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalTransactions,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                    limit,
                },
            };
        });
    } catch (error) {
        console.error('Error in getTransactionsPaginated:', error);
        throw error;
    }
}
