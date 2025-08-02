import { PrismaClient } from "@prisma/client";

// Clear any existing global prisma instance for PostgreSQL migration
if (globalThis.prisma) {
    globalThis.prisma.$disconnect();
    delete globalThis.prisma;
}

// Create new PostgreSQL client instance
const createPrismaClient = () => new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

export const db = createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}

// Add connection timeout handling with retry logic
db.$connect().catch((error) => {
    console.error("Database connection failed:", error);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(() => {
        db.$connect().catch(console.error);
    }, 5000);
});

// globalThis.prisma: This global variable ensures that the prisma client
// instances is reused across hot reloads during development. Without this,
// each  time your application reloads, a new instance of the Prisma client
// would be created, potentially leading to connection issues.
