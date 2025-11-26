import { useEffect, useState, useMemo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import SearchbarRow from '../sectionSearchbar/SearchbarRow';
import ProductGrid from './productsChildren/ProductGrid';
import ProductPopup from './productsChildren/ProductPopup';
import { getColdStart, searchRecommendations } from '@api/recommendations';
import { logView } from '@api/events';
import { useTheme } from '@resources/themes/themeContext';
import { normalizeProducts } from '@utils/helpers';

function RecommendedProducts() {
  const { theme } = useTheme();

  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
  });

  const [searchState, setSearchState] = useState({
    query: '',
    loading: false,
    error: null,
    items: [],
  });

  const searching = searchState.query.length > 0;

  const [selected, setSelected] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 4;

  // Run search
  const performSearch = useCallback(async (q) => {
    setSearchState((s) => ({ ...s, query: q }));

    if (!q) {
      setSearchState({
        query: '',
        loading: false,
        error: null,
        items: [],
      });
      return;
    }

    setSearchState((s) => ({ ...s, loading: true, error: null }));

    try {
      const data = await searchRecommendations(q, 12);
      const items = Array.isArray(data?.results) ? data.results : [];

      setSearchState({
        query: q,
        loading: false,
        error: null,
        items,
      });
    } catch (err) {
      setSearchState({
        query: q,
        loading: false,
        error: err?.message || 'Search failed',
        items: [],
      });
    }
  }, []);

  // Cold-start load
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getColdStart(12);
        const items = Array.isArray(data?.results) ? data.results : [];

        if (active)
          setState({
            loading: false,
            error: null,
            items,
          });
      } catch (err) {
        if (active)
          setState({
            loading: false,
            error: err?.message || 'Failed to load',
            items: [],
          });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Normalize here — same as Featured
  const filteredProducts = useMemo(() => {
    const base = searching ? searchState.items : state.items;
    return normalizeProducts(base || []);
  }, [searching, searchState.items, state.items]);

  // Pagination logic
  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const start = pageIndex * pageSize;
  const end = start + pageSize;
  const visibleProducts = filteredProducts.slice(start, end);

  // Clamp page
  useEffect(() => {
    setPageIndex((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  // Reset page on new search
  useEffect(() => {
    setPageIndex(0);
  }, [searching, searchState.query]);

  const handlePrevPage = useCallback(
    () => setPageIndex((prev) => Math.max(0, prev - 1)),
    []
  );

  const handleNextPage = useCallback(
    () => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1)),
    [totalPages]
  );

  const handleView = useCallback(
    async (p) => {
      setSelected(p);
      try {
        await logView(p, searching ? 'search' : 'cold_start');
      } catch (e) {
        console.warn(e);
      }
    },
    [searching]
  );

  return (
    <Col className="d-flex flex-column w-100 p-0">
      <SearchbarRow
        searchId="recommendedSearch"
        placeholder="Search..."
        sectionTitle="Recommended Products"
        onSearch={performSearch}
      />

      <div className="d-flex flex-column w-100 m-0 p-0 pt-1">
        <div className="d-flex justify-content-between align-items-center px-1">
          <Button
            type="button"
            onClick={handlePrevPage}
            disabled={pageIndex === 0}
            className="btn btn-sm px-1 pt-0"
            style={{
              ...theme.buttons.emphasis,
              paddingBottom: '.06rem',
            }}
          >
            &#10229;
          </Button>

          <span className="small">
            Page {totalProducts === 0 ? 0 : pageIndex + 1} of {totalPages}
          </span>

          <Button
            type="button"
            onClick={handleNextPage}
            disabled={pageIndex >= totalPages - 1}
            className="btn btn-sm px-1 pt-0"
            style={{
              ...theme.buttons.emphasis,
              paddingBottom: '.06rem',
            }}
          >
            &#10230;
          </Button>
        </div>

        <ProductGrid
          products={visibleProducts}
          onSelect={handleView}
          loading={searching ? searchState.loading : state.loading}
          error={(searching ? searchState.error : state.error) || null}
        />
      </div>

      <ProductPopup
        product={selected}
        show={!!selected}
        onClose={() => setSelected(null)}
      />
    </Col>
  );
}

export default RecommendedProducts;
