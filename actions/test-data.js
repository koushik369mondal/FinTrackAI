"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function createTestTransactions(accountId, count = 100) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Verify account belongs to user
        const account = await db.account.findFirst({
            where: {
                id: accountId,
                userId: user.id,
            },
        });

        if (!account) {
            throw new Error("Account not found");
        }

        const categories = [
            "food",           // Maps to Food category
            "transportation", // Maps to Transportation category  
            "shopping",       // Maps to Shopping category
            "entertainment",  // Maps to Entertainment category
            "utilities",      // Maps to Bills & Utilities
            "healthcare",     // Maps to Healthcare category
            "education",      // Maps to Education category
            "travel",         // Maps to Travel category
            "investments",    // Maps to Investment category
            "salary",         // Maps to Salary category
            "freelance",      // Maps to Freelance category
            "business"        // Maps to Business category
        ];

        const descriptions = [
            "Grocery shopping",
            "Gas station",
            "Restaurant dinner",
            "Online purchase",
            "Monthly subscription",
            "Utility bill",
            "Medical checkup",
            "Movie tickets",
            "Book purchase",
            "Coffee shop",
            "Taxi ride",
            "Salary deposit",
            "Freelance payment",
            "Investment return",
            "Business expense",
            "Internet bill",
            "Phone bill",
            "Rent payment",
            "Insurance premium",
            "Gym membership"
        ];

        const transactions = [];
        
        for (let i = 0; i < count; i++) {
            const isExpense = Math.random() > 0.3; // 70% expenses, 30% income
            const amount = isExpense 
                ? Math.floor(Math.random() * 500) + 10  // $10-$510 for expenses
                : Math.floor(Math.random() * 2000) + 100; // $100-$2100 for income
            
            const category = categories[Math.floor(Math.random() * categories.length)];
            const description = descriptions[Math.floor(Math.random() * descriptions.length)];
            
            // Random date in the last 6 months
            const date = new Date();
            date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
            date.setDate(Math.floor(Math.random() * 28) + 1);

            transactions.push({
                amount,
                description: `${description} #${i + 1}`,
                category,
                type: isExpense ? "EXPENSE" : "INCOME",
                date,
                accountId,
                userId: user.id,
            });
        }

        const result = await db.transaction.createMany({
            data: transactions,
        });

        console.log(`Created ${result.count} test transactions`);
        return { success: true, count: result.count };

    } catch (error) {
        console.error('Error creating test transactions:', error);
        throw error;
    }
}
