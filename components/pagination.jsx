"use client";

import { Button } from "@/components/ui/button";
import { 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight 
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import PageSizeSelector from "./page-size-selector";

const Pagination = ({ 
    currentPage, 
    totalPages, 
    totalTransactions, 
    onPageChange,
    onPageSizeChange,
    limit = 10 
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Debug logging
    console.log('Pagination props:', { currentPage, totalPages, totalTransactions, limit });

    const updateUrl = useCallback((page) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        if (limit !== 20) { // Changed default back to 20
            params.set('limit', limit.toString());
        }
        router.push(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams, limit]);

    const handlePageChange = useCallback((page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            console.log('Changing to page:', page);
            // Call the onPageChange callback directly instead of updating URL
            onPageChange?.(page);
        }
    }, [currentPage, totalPages, onPageChange]);

    // Always show pagination if there are transactions, even if only one page
    if (!totalTransactions || totalTransactions === 0) return null;

    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalTransactions);

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const showPages = 5; // Show 5 page numbers at most
        
        if (totalPages <= showPages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages around current page
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + showPages - 1);
            
            // Adjust start if we're near the end
            if (end - start < showPages - 1) {
                start = Math.max(1, end - showPages + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col gap-4 py-4 border-t bg-gray-50 rounded-lg">
            {/* Page size selector */}
            <div className="flex justify-center">
                <PageSizeSelector 
                    currentLimit={limit} 
                    onPageSizeChange={onPageSizeChange}
                />
            </div>

            {/* Pagination info and controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results info */}
                <div className="text-sm text-muted-foreground">
                    Showing {startItem} to {endItem} of {totalTransactions} transactions
                </div>

                {/* Pagination controls - Always show if there are transactions */}
                <div className="flex items-center gap-2">
                    {/* First page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                        title="First page"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* Previous page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                        title="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page numbers */}
                    {pageNumbers.map((pageNum) => (
                        <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="h-8 w-8 p-0"
                        >
                            {pageNum}
                        </Button>
                    ))}

                    {/* Add ellipsis and last page if needed */}
                    {totalPages > 5 && pageNumbers[pageNumbers.length - 1] < totalPages && (
                        <>
                            <span className="text-muted-foreground">...</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(totalPages)}
                                className="h-8 w-8 p-0"
                            >
                                {totalPages}
                            </Button>
                        </>
                    )}

                    {/* Next page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                        title="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Last page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                        title="Last page"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
