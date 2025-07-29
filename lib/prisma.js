import { PrismaClient } from "@prisma/client";

export const db = globalThis.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}

// Add connection timeout handling
db.$connect().catch((error) => {
    console.error("Database connection failed:", error);
});

// globalThis.prisma: This global variable ensures that the prisma client
// instances is reused across hot reloads during development. Without this,
// each  time your application reloads, a new instance of the Prisma client
// would be created, potentially leading to connection issues.
