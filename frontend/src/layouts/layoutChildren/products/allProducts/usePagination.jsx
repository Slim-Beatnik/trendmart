import { useState, useMemo, useEffect } from 'react';

// Keep as .jsx for now but export default hook; optionally rename to .js for consistency.
export default function usePagination(items, initialSize = 16) {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(initialSize);

    const totalItems = items.length;
    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalItems / pageSize)),
        [totalItems, pageSize]
    );

    // Clamp page index if data shrinks
    useEffect(() => {
        setPageIndex(p => Math.min(p, totalPages - 1));
    }, [totalPages]);

    const pageStart = pageIndex * pageSize;
    const visibleItems = items.slice(pageStart, pageStart + pageSize);

    return {
        pageIndex,
        setPageIndex,
        pageSize,
        setPageSize,
        totalItems,
        totalPages,
        visibleItems
    };
}