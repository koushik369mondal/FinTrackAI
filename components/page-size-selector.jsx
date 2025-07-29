"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const PageSizeSelector = ({ currentLimit = 10, onPageSizeChange }) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageSizeChange = useCallback((newLimit) => {
        // Use the callback if provided, otherwise fall back to URL update
        if (onPageSizeChange) {
            onPageSizeChange(parseInt(newLimit));
        } else {
            // Fallback to URL update for cases where callback isn't provided
            const params = new URLSearchParams(searchParams);
            params.set('limit', newLimit);
            params.set('page', '1'); // Reset to first page when changing page size
            router.push(`?${params.toString()}`, { scroll: false });
        }
    }, [router, searchParams, onPageSizeChange]);

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={currentLimit.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="1000">All</SelectItem>
                </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
        </div>
    );
};

export default PageSizeSelector;
