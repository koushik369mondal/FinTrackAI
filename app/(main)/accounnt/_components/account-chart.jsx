"use client";

import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const DATE_RANGES = {
    "7D": { label: "Last 7 Days", days: 7 },
    "1M": { label: "Last Month", days: 30 },
    "3M": { label: "Last 3 Months", days: 90 },
    "6M": { label: "Last 6 Months", days: 180 },
    ALL: { label: "All Time", days: null },
};

export default function AccountChart({ transactions }) {
    const [dateRange, setDateRange] = useState("1M");

    const filteredData = useMemo(() => {
        const range = DATE_RANGES[dateRange];
        const now = new Date();
        const startDate = range.days
            ? startOfDay(subDays(now, range.days))
            : startOfDay(new Date(0));

        // Filter transactions within date range
        const filtered = transactions.filter(
            (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
        );

        // Create array of all days in the range
        const days = [];
        if (range.days) {
            // Generate all days in the range
            for (let i = range.days - 1; i >= 0; i--) {
                const date = subDays(now, i);
                const dateKey = format(date, "yyyy-MM-dd");
                const displayDate = format(date, "dd MMM"); // Show date and month (e.g., "15 Jan")
                days.push({
                    date: dateKey,
                    displayDate,
                    income: 0,
                    expense: 0
                });
            }
        } else {
            // For "All Time", group by date as before
            const grouped = filtered.reduce((acc, transaction) => {
                const date = format(new Date(transaction.date), "yyyy-MM-dd");
                const displayDate = format(new Date(transaction.date), "dd MMM"); // Show date and month
                if (!acc[date]) {
                    acc[date] = { date, displayDate, income: 0, expense: 0 };
                }
                if (transaction.type === "INCOME") {
                    acc[date].income += transaction.amount;
                } else {
                    acc[date].expense += transaction.amount;
                }
                return acc;
            }, {});
            
            return Object.values(grouped).sort(
                (a, b) => new Date(a.date) - new Date(b.date)
            );
        }

        // Fill in transaction data for each day
        filtered.forEach(transaction => {
            const transactionDate = format(new Date(transaction.date), "yyyy-MM-dd");
            const dayIndex = days.findIndex(day => day.date === transactionDate);
            
            if (dayIndex !== -1) {
                if (transaction.type === "INCOME") {
                    days[dayIndex].income += transaction.amount;
                } else {
                    days[dayIndex].expense += transaction.amount;
                }
            }
        });

        return days;
    }, [transactions, dateRange]);

    // Calculate totals for the selected period
    const totals = useMemo(() => {
        return filteredData.reduce(
            (acc, day) => ({
                income: acc.income + day.income,
                expense: acc.expense + day.expense,
            }),
            { income: 0, expense: 0 }
        );
    }, [filteredData]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <CardTitle className="text-5xl sm:text-6xl font-bold gradient-title">
                    Transaction Overview
                </CardTitle>
                <Select defaultValue={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="flex justify-around mb-6 text-sm">
                    <div className="text-center">
                        <p className="text-muted-foreground">Total Income</p>
                        <p className="text-lg font-bold text-green-500">
                            ${totals.income.toFixed(2)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">Total Expenses</p>
                        <p className="text-lg font-bold text-red-500">
                            ${totals.expense.toFixed(2)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">Net</p>
                        <p
                            className={`text-lg font-bold ${totals.income - totals.expense >= 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                        >
                            ${(totals.income - totals.expense).toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval={dateRange === "7D" ? 0 : dateRange === "1M" ? 2 : 5}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                labelFormatter={(label) => `Date: ${label}`}
                                formatter={(value, name) => [`$${value.toFixed(2)}`, name === 'income' ? 'Income' : 'Expense']}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="income"
                                name="Income"
                                fill="#22c55e"
                                radius={[2, 2, 0, 0]}
                                maxBarSize={dateRange === "7D" ? 40 : dateRange === "1M" ? 20 : 15}
                            />
                            <Bar
                                dataKey="expense"
                                name="Expense"
                                fill="#ef4444"
                                radius={[2, 2, 0, 0]}
                                maxBarSize={dateRange === "7D" ? 40 : dateRange === "1M" ? 20 : 15}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
