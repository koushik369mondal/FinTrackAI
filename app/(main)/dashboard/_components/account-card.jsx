"use client";

import React, { useEffect } from "react";
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
import useFetch from "@/hooks/use-fetch";
import { updateDefaultAccount } from "@/actions/accounts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AccountCard({ account }) {
    const { name, type, balance, id, isDefault } = account;
    const router = useRouter();

    const {
        loading: updateDefaultLoading,
        fn: updateDefaultFn,
        data: updatedAccount,
        error,
    } = useFetch(updateDefaultAccount);

    const handleDefaultChange = async (checked) => {
        if (isDefault) {
            toast.warning("You need at least 1 default account");
            return; // Don't allow toggling off the default account
        }

        if (checked) {
            await updateDefaultFn(id);
        }
    };

    const handleSwitchClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    useEffect(() => { 
        if(updatedAccount?.success) {
            toast.success("Default account updated successfully");
            // Refresh the page to show updated account states
            router.refresh();
        }
    }, [updatedAccount, updateDefaultLoading]);

    useEffect(() => { 
        if(error) {
            toast.error(error.message || "Failed to update default account");
        }
    }, [error]);

    return (
        <Card className="hover:shadow-md transition-shadow group relative">
            <Link href={`/accounnt/${id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                        {name}
                    </CardTitle>
                    <div onClick={handleSwitchClick}>
                        <Switch
                            checked={isDefault}
                            onCheckedChange={handleDefaultChange}
                            disabled={updateDefaultLoading}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${parseFloat(balance).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                        {type.charAt(0) + type.slice(1).toLowerCase()} Account
                    </p>
                </CardContent>
                <CardFooter className="flex justify-between text-sm text-muted-foreground mt-4">
                    <div className="flex items-center">
                        <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                        Income
                    </div>
                    <div className="flex items-center">
                        <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                        Expense
                    </div>
                </CardFooter>
            </Link>
        </Card>
    );
}
