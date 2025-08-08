"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Mapping from old category names to new category IDs
const CATEGORY_MAPPING = {
    "Food & Dining": "food",
    "Transportation": "transportation",
    "Shopping": "shopping",
    "Entertainment": "entertainment",
    "Bills & Utilities": "utilities",
    "Healthcare": "healthcare",
    "Education": "education",
    "Travel": "travel",
    "Investment": "investments",
    "Salary": "salary",
    "Freelance": "freelance",
    "Business": "business",
    "Grocery shopping": "groceries",
    "Gas station": "transportation",
    "Restaurant dinner": "food",
    "Online purchase": "shopping",
    "Monthly subscription": "utilities",
    "Utility bill": "utilities",
    "Medical checkup": "healthcare",
    "Movie tickets": "entertainment",
    "Book purchase": "education",
    "Coffee shop": "food",
    "Taxi ride": "transportation",
    "Salary deposit": "salary",
    "Freelance payment": "freelance",
    "Investment return": "investments",
    "Business expense": "business",
    "Internet bill": "utilities",
    "Phone bill": "utilities",
    "Rent payment": "housing",
    "Insurance premium": "insurance",
    "Gym membership": "personal"
};

export async function fixTransactionCategories() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Get all transactions with old category names
        const transactions = await db.transaction.findMany({
            where: {
                userId: user.id,
            },
        });

        const updates = [];
        let fixedCount = 0;

        for (const transaction of transactions) {
            const oldCategory = transaction.category;
            const newCategory = CATEGORY_MAPPING[oldCategory];
            
            if (newCategory && newCategory !== oldCategory) {
                updates.push(
                    db.transaction.update({
                        where: { id: transaction.id },
                        data: { category: newCategory },
                    })
                );
                fixedCount++;
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        return {
            success: true,
            message: `Fixed ${fixedCount} transaction categories`,
            totalTransactions: transactions.length,
            fixedTransactions: fixedCount,
        };
    } catch (error) {
        console.error("Error fixing categories:", error);
        return {
            success: false,
            error: error.message || "Failed to fix categories",
        };
    }
}

export async function getProblematicCategories() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Get all unique categories
        const categories = await db.transaction.findMany({
            where: {
                userId: user.id,
            },
            select: {
                category: true,
            },
            distinct: ['category'],
        });

        const validCategories = [
            "salary", "freelance", "investments", "business", "rental", "other-income",
            "housing", "transportation", "groceries", "utilities", "entertainment", 
            "food", "shopping", "healthcare", "education", "personal", "travel", 
            "insurance", "gifts", "bills", "other-expense"
        ];

        const problematic = categories
            .map(t => t.category)
            .filter(cat => !validCategories.includes(cat))
            .filter(cat => cat !== null && cat !== undefined);

        return {
            success: true,
            problematicCategories: problematic,
            suggestions: problematic.map(cat => ({
                current: cat,
                suggested: CATEGORY_MAPPING[cat] || "other-expense"
            }))
        };
    } catch (error) {
        console.error("Error getting problematic categories:", error);
        return {
            success: false,
            error: error.message || "Failed to get categories",
        };
    }
}
