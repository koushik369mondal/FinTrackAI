"use client";

import { bulkDeleteTransactions, deleteTransaction } from "@/actions/accounts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { categoryColors } from "@/data/categories";
import useFetch from "@/hooks/use-fetch";
import { format } from "date-fns";
import {
    ChevronDown,
    ChevronUp,
    Clock,
    MoreHorizontal,
    RefreshCcw,
    RefreshCw,
    Search,
    Trash,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
// import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";

const RECURRING_INTERVALS = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    YEARLY: "Yearly",
};

const TransactionTable = ({ transactions: initialTransactions, onTransactionUpdate }) => {
    const router = useRouter();
    const pathname = usePathname();
    const isMountedRef = useRef(true);
    const [transactions, setTransactions] = useState(initialTransactions);
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        field: "date",
        direction: "desc",
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [recurringFilter, setRecurringFilter] = useState("");
    const [deletingTransactionId, setDeletingTransactionId] = useState(null);
    const [operationTimeout, setOperationTimeout] = useState(null);

    // Track component mount/unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Safe parent update function
    const safeParentUpdate = useCallback((updatedTransactions, balanceChange) => {
        // Use setTimeout to schedule the update outside of the current render cycle
        setTimeout(() => {
            if (isMountedRef.current && onTransactionUpdate) {
                try {
                    onTransactionUpdate(updatedTransactions, balanceChange);
                } catch (error) {
                    console.error('Error updating parent component:', error);
                }
            }
        }, 0);
    }, [onTransactionUpdate]);

    const {
        loading: deleteLoading,
        fn: deleteFn,
        data: deleted,
        reset: resetDelete,
    } = useFetch(bulkDeleteTransactions);

    const {
        loading: singleDeleteLoading,
        fn: singleDeleteFn,
        data: singleDeleted,
        reset: resetSingleDelete,
    } = useFetch(deleteTransaction);

    // Add timeout protection for long-running operations
    useEffect(() => {
        if ((deleteLoading || singleDeleteLoading) && !operationTimeout) {
            const timeout = setTimeout(() => {
                toast.error('Operation is taking longer than expected. Please refresh the page.');
                setDeletingTransactionId(null);
                setOperationTimeout(null);
            }, 15000); // 15 second timeout
            
            setOperationTimeout(timeout);
        } else if (!deleteLoading && !singleDeleteLoading && operationTimeout) {
            clearTimeout(operationTimeout);
            setOperationTimeout(null);
        }
        
        return () => {
            if (operationTimeout) {
                clearTimeout(operationTimeout);
            }
        };
    }, [deleteLoading, singleDeleteLoading, operationTimeout]);

    // console.log(selectedIds);

    // Update local state when transactions prop changes
    useEffect(() => {
        setTransactions(initialTransactions);
    }, [initialTransactions]);

    const filteredAndSortedTransactions = useMemo(() => {
        let result = [...transactions];

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter((transaction) =>
                transaction.description?.toLowerCase().includes(searchLower)
            );
        }

        // Apply recurring filter
        if (recurringFilter) {
            result = result.filter((transaction) => {
                if (recurringFilter === "recurring") return transaction.isRecurring;
                return !transaction.isRecurring;
            });
        }

        // Apply type filter
        if (typeFilter) {
            result = result.filter((transaction) => transaction.type === typeFilter);
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;

            switch (sortConfig.field) {
                case "date":
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case "amount":
                    comparison = a.amount - b.amount;
                    break;
                case "category":
                    comparison = a.category.localeCompare(b.category);
                    break;
                default:
                    comparison = 0;
            }
            return sortConfig.direction === "asc" ? comparison : -comparison;
        });

        return result;
    }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

    const handleSort = useCallback((field) => {
        setSortConfig((current) => ({
            field,
            direction:
                current.field == field && current.direction === "asc" ? "desc" : "asc",
        }));
    }, []);

    const handleSelect = useCallback((id) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedIds((current) =>
            current.length === filteredAndSortedTransactions.length
                ? []
                : filteredAndSortedTransactions.map((t) => t.id)
        );
    }, [filteredAndSortedTransactions]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) return;
        
        if (
            !window.confirm(
                `Are you sure you want to delete ${selectedIds.length} transactions?`
            )
        ) {
            return;
        }
        
        try {
            await deleteFn(selectedIds);
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('Failed to delete transactions. Please try again.');
        }
    }, [selectedIds, deleteFn]);

    const handleSingleDelete = useCallback(async (transactionId) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) {
            return;
        }
        
        setDeletingTransactionId(transactionId);
        
        try {
            await singleDeleteFn(transactionId);
        } catch (error) {
            console.error('Single delete error:', error);
            toast.error('Failed to delete transaction. Please try again.');
            setDeletingTransactionId(null);
        }
    }, [singleDeleteFn]);

    useEffect(() => {
        if (deleted && !deleteLoading) {
            const handleSuccess = async () => {
                if (deleted.success) {
                    toast.success(deleted.message || "Transactions deleted successfully");
                    
                    // Use functional updates to avoid stale state references
                    setTransactions(currentTransactions => {
                        // Calculate balance change for deleted transactions
                        const deletedTransactions = currentTransactions.filter(t => selectedIds.includes(t.id));
                        const balanceChange = deletedTransactions.reduce((sum, t) => {
                            return sum + (t.type === "EXPENSE" ? Number(t.amount) : -Number(t.amount));
                        }, 0);
                        
                        // Get updated transactions
                        const updatedTransactions = currentTransactions.filter(t => !selectedIds.includes(t.id));
                        
                        // Schedule parent update safely
                        safeParentUpdate(updatedTransactions, balanceChange);
                        
                        return updatedTransactions;
                    });
                    setSelectedIds([]); // Clear selection after successful delete
                } else {
                    toast.error(deleted.error || "Failed to delete transactions");
                }
                
                // Clear the operation timeout
                if (operationTimeout) {
                    clearTimeout(operationTimeout);
                    setOperationTimeout(null);
                }
                
                // Reset the fetch state to prevent re-triggering
                setTimeout(() => resetDelete(), 100);
            };
            
            handleSuccess();
        }
    }, [deleted, deleteLoading, resetDelete, safeParentUpdate]);

    useEffect(() => {
        if (singleDeleted && !singleDeleteLoading) {
            const handleSuccess = async () => {
                if (singleDeleted.success) {
                    toast.success(singleDeleted.message || "Transaction deleted successfully");
                    // Immediately remove deleted transaction from local state
                    if (deletingTransactionId) {
                        setTransactions(currentTransactions => {
                            const deletedTransaction = currentTransactions.find(t => t.id === deletingTransactionId);
                            const balanceChange = deletedTransaction ? 
                                (deletedTransaction.type === "EXPENSE" ? Number(deletedTransaction.amount) : -Number(deletedTransaction.amount)) : 0;
                            
                            const updatedTransactions = currentTransactions.filter(t => t.id !== deletingTransactionId);
                            
                            // Schedule parent update safely
                            safeParentUpdate(updatedTransactions, balanceChange);
                            
                            return updatedTransactions;
                        });
                        
                        setDeletingTransactionId(null);
                    }
                } else {
                    toast.error(singleDeleted.error || "Failed to delete transaction");
                    setDeletingTransactionId(null);
                }
                
                // Clear the operation timeout
                if (operationTimeout) {
                    clearTimeout(operationTimeout);
                    setOperationTimeout(null);
                }
                
                // Reset the fetch state to prevent re-triggering
                setTimeout(() => resetSingleDelete(), 100);
            };
            
            handleSuccess();
        }
    }, [singleDeleted, singleDeleteLoading, resetSingleDelete, safeParentUpdate]);

    const handleClearFilters = () => {
        setSearchTerm("");
        setTypeFilter("");
        setRecurringFilter("");
        setSelectedIds([]);
    };

    return (
        <div className="space-y-4 relative">
            {/* Loading overlay for delete operations */}
            {(deleteLoading || singleDeleteLoading) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg border">
                        <BarLoader width={200} color="#9333ea" />
                        <p className="text-center mt-2 text-sm text-gray-600">
                            {deleteLoading ? 'Deleting transactions...' : 'Deleting transaction...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters  */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-8"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={recurringFilter}
                        onValueChange={(value) => setRecurringFilter(value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Transactions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recurring">Recurring Only</SelectItem>
                            <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
                        </SelectContent>
                    </Select>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                            >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Selected({selectedIds.length})
                            </Button>
                            <div />
                        </div>
                    )}

                    {(searchTerm || typeFilter || recurringFilter) && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleClearFilters}
                            title="Clear Filters"
                        >
                            <X className="h-4 w-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Transactions   */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    onCheckedChange={handleSelectAll}
                                    checked={
                                        selectedIds.length ===
                                        filteredAndSortedTransactions.length &&
                                        filteredAndSortedTransactions.length > 0
                                    }
                                />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort("date")}
                            >
                                <div className="flex items-center">
                                    Date{" "}
                                    {sortConfig.field === "date" &&
                                        (sortConfig.direction === "asc" ? (
                                            <ChevronUp className="h-4 w-4 ml-1" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 ml-1" />
                                        ))}
                                </div>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort("category")}
                            >
                                <div className="flex items-center">
                                    Category
                                    {sortConfig.field === "category" &&
                                        (sortConfig.direction === "asc" ? (
                                            <ChevronUp className="h-4 w-4 ml-1" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 ml-1" />
                                        ))}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort("amount")}
                            >
                                <div className="flex items-center justify-end">
                                    Amount
                                    {sortConfig.field === "amount" &&
                                        (sortConfig.direction === "asc" ? (
                                            <ChevronUp className="h-4 w-4 ml-1" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 ml-1" />
                                        ))}
                                </div>
                            </TableHead>
                            <TableHead>Recurring</TableHead>
                            <TableHead className="w-[50px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center text-muted-foreground"
                                >
                                    No Transactions Found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        <Checkbox
                                            onCheckedChange={() => handleSelect(transaction.id)}
                                            checked={selectedIds.includes(transaction.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(transaction.date), "PP")}
                                    </TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className="capitalize">
                                        <span
                                            style={{
                                                background: categoryColors[transaction.category],
                                            }}
                                            className="px-2 py-1 rounded text-white text-sm"
                                        >
                                            {transaction.category}
                                        </span>
                                    </TableCell>
                                    <TableCell
                                        className="text-right font-medium"
                                        style={{
                                            color: transaction.type === "EXPENSE" ? "red" : "green",
                                        }}
                                    >
                                        {transaction.type === "EXPENSE" ? "-" : "+"}₹
                                        {transaction.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.isRecurring ? (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge
                                                        variant="outline"
                                                        className="gap-1 bg-purple-400 hover:bg-purple-200"
                                                    >
                                                        <RefreshCw className="h-3 w-3" />
                                                        {RECURRING_INTERVALS[transaction.recurringInterval]}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="text-sm">
                                                        <div className="font-medium">Next Date:</div>
                                                        <div>
                                                            {format(
                                                                new Date(transaction.nextRecurringDate),
                                                                "PP"
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <Badge variant="outline" className="gap-1">
                                                <Clock className="h-3 w-3" />
                                                One-time
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel
                                                    onClick={() =>
                                                        router.push(
                                                            `/transaction/create?edit=${transaction.id}`
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleSingleDelete(transaction.id)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default React.memo(TransactionTable);
