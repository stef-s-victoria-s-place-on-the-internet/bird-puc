interface PaginationControlsProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  filteredCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function PaginationControls({
  currentPage,
  totalCount,
  pageSize,
  hasNextPage,
  filteredCount,
  onPreviousPage,
  onNextPage
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const showPagination = totalCount > pageSize;

  return (
    <div className="pagination-controls">
      <div className="pagination-info">
        <span>
          Showing {filteredCount} of {totalCount} detections
        </span>
        {showPagination && (
          <span className="pagination-pages">
            (Page {currentPage} of {totalPages})
          </span>
        )}
      </div>
      {showPagination && (
        <div className="pagination-buttons">
          <button
            onClick={onPreviousPage}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="Previous page"
          >
            <span>←</span>
            Previous
          </button>
          <span className="pagination-current">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={!hasNextPage || currentPage >= totalPages}
            className="pagination-btn"
            title="Next page"
          >
            Next
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}

