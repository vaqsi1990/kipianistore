"use client";

import React, { FC, useCallback, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Button } from "./ui/button";

interface PaginationProps {
  pageCount: number;
}

interface PaginationArrowProps {
  direction: "left" | "right";
  onClick: () => void;
  isDisabled: boolean;
}

const PaginationArrow: FC<PaginationArrowProps> = React.memo(
  ({ direction, onClick, isDisabled }) => {
    const isLeft = direction === "left";

    return (
      <Button  variant="outline"
        onClick={onClick}
        className="flex items-center justify-center w-10 h-10 bg-white text-gray-700  shadow-md hover:shadow-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all duration-300 transform hover:scale-105"
        aria-label={isLeft ? "Previous page" : "Next page"}
        disabled={isDisabled}
      >
        {isLeft ? <FaArrowLeft className="w-4 h-4" /> : <FaArrowRight className="w-4 h-4" />}
      </Button>
    );
  }
);

PaginationArrow.displayName = "PaginationArrow";

const PaginationContent: FC<PaginationProps> = ({ pageCount }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = useCallback(
    (pageNumber: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", pageNumber.toString());
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const goToPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber !== currentPage && pageNumber > 0 && pageNumber <= pageCount) {
        router.push(createPageURL(pageNumber));
      }
    },
    [currentPage, createPageURL, pageCount, router]
  );

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (pageCount <= maxVisible) {
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(pageCount);
      } else if (currentPage >= pageCount - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = pageCount - 3; i <= pageCount; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(pageCount);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-2">
      <PaginationArrow
        direction="left"
        onClick={() => goToPage(currentPage - 1)}
        isDisabled={currentPage <= 1}
      />
      
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-2 text-gray-500">...</span>
          ) : (
            <Button  variant="outline"
              onClick={() => goToPage(page as number)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 transform hover:scale-105 ${
                currentPage === page
                  ? 'bg-[#bbb272] hover:bg-[#bbb272]/80 text-white shadow-lg shadow-primary/25'
                  : 'bg-white text-gray-700  shadow-md hover:shadow-lg border border-gray-200'
              }`}
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}
      
      <PaginationArrow
        direction="right"
        onClick={() => goToPage(currentPage + 1)}
        isDisabled={currentPage >= pageCount}
      />
    </div>
  );
};

// Main export component
const PaginationComponent: FC<PaginationProps> = ({ pageCount }) => {
  if (pageCount <= 1) return null;
  
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 bg-[#FF7A00]"></div>
      </div>
    }>
      <PaginationContent pageCount={pageCount} />
    </Suspense>
  );
};

export default React.memo(PaginationComponent);
