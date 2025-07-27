import React from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AccountCard({ account }) {
    const { name, type, balance, id, isDefault } = account;
    return (
        <Card>
            <Link href={`/accounts/${id}`}>
                <CardHeader>
                    <CardTitle>{name}</CardTitle>
                    <Switch />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${parseFloat(balance).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                        {type.charAt(0) + type.slice(1).toLowerCase()} Account
                    </p>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center">
                        <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                        Income
                    </div>
                    <div className="flex items-center">
                        <ArrowDownRight className="ml-7 mr-1 h-4 w-4 text-red-500" />
                        Expense
                    </div>
                </CardFooter>
            </Link>
        </Card>
    );
}
