"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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

export async function getAccountWithTransactions(accountId) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const account = await db.account.findUnique({
        where: {
            id: accountId,
            userId: user.id,
        },
        include: {
            transactions: {
                orderBy: { date: "desc" },
            },
            _count: {
                select: {
                    transactions: true,
                },
            },
        },
    });
    if (!account) return null;

    return {
        ...serializeTransaction(account),
        transactions: account.transactions.map(serializeTransaction),
    };
}
