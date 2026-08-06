// ============================================================
// ImportHistoryPagination.tsx
// ------------------------------------------------------------
// currentPage lives in the PARENT's state (ImportHistory.tsx)
// and is passed down as a prop, along with onPageChange to
// update it. This component itself holds no state — it's a
// "controlled" component, the same idea as the controlled
// search input, just applied to page numbers instead of text.
// ============================================================

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImportHistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Builds the list of page buttons to show, collapsing long runs
// into an ellipsis — e.g. for page 1 of 13: [1, 2, 3, 'ellipsis', 13].
// Kept as a plain function (not a hook) since it's pure: same
// inputs always produce the same output, no state involved.
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 1) return [1];

  const pages = new Set<number>([1, total, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push('ellipsis');
    }
    result.push(page);
  });

  return result;
}

export default function ImportHistoryPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ImportHistoryPaginationProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="import-history-pagination">
      <span className="pagination-summary">
        Page {currentPage} of {totalPages}
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn pagination-btn-text"
          disabled={isFirstPage}
          aria-label="Go to previous page"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`pagination-btn pagination-page ${
                page === currentPage ? 'active' : ''
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          className="pagination-btn pagination-btn-text"
          disabled={isLastPage}
          aria-label="Go to next page"
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}