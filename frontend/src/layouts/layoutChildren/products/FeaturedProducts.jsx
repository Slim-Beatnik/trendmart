import { useEffect, useState, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import ProductGrid from './productsChildren/ProductGrid';
import SearchbarRow from '../sectionSearchbar/SearchbarRow';
import ProductPopup from './productsChildren/ProductPopup';
import { listProducts, getProductsByCategory } from '@api/catalog';
import { normalizeProducts } from '@utils/helpers';
import { useTheme } from '@resources/themes/themeContext';
import { useDispatch } from 'react-redux';
import { addItem, attachBackendId } from '@redux/cart/cartSlice';
import { addToCart as addToCartApi } from '@api/cart';
import { logCartAdd } from '@api/events';

function FeaturedProducts({
  activeCategoryId,
  activeCategoryName,
  onClearCategory,
}) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [fullProducts, setFullProducts] = useState([]); // complete catalog cache
  const [categoryProducts, setCategoryProducts] = useState(null); // scoped list for active category
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 4;

  // Initial catalog load
  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const raw = await listProducts();
        if (!ignore) setFullProducts(normalizeProducts(raw));
      } catch (e) {
        if (!ignore) setError(e.message || 'Failed to load products');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  // Load category-specific products when selection changes
  useEffect(() => {
    let ignore = false;
    async function loadCategory(catId) {
      if (!catId) {
        setCategoryProducts(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Prefer backend category endpoint
        const raw = await getProductsByCategory(catId);
        if (!ignore) setCategoryProducts(normalizeProducts(raw));
      } catch (e) {
        if (!ignore) {
          setError(e.message || 'Failed to load category products');
          setCategoryProducts(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadCategory(activeCategoryId);
    setPageIndex(0); // reset pagination on category change
    return () => {
      ignore = true;
    };
  }, [activeCategoryId]);

  const handleSearch = useCallback(
    (value) => setSearch(value.trim().toLowerCase()),
    []
  );
  const handleView = useCallback((p) => setSelected(p), []);
  const handleClosePopup = useCallback(() => setSelected(null), []);

  const sourceProducts = useMemo(
    () => (categoryProducts ? categoryProducts : fullProducts),
    [categoryProducts, fullProducts]
  );

  // Featured selection: take top 10 (by score if present, otherwise original order)
  const featured = useMemo(() => {
    if (!sourceProducts.length) return [];
    const withScore = [...sourceProducts].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );
    return withScore.slice(0, 10);
  }, [sourceProducts]);

  // Global search across full catalog (ignores category scope by design)
  const searchResults = useMemo(() => {
    if (!search) return [];
    return fullProducts.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search))
    );
  }, [fullProducts, search]);

  const filteredProducts = useMemo(
    () => (search ? searchResults : featured),
    [search, searchResults, featured]
  );

  // Pagination metrics
  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const start = pageIndex * pageSize;
  const end = start + pageSize;
  const visibleProducts = filteredProducts.slice(start, end);

  // Clamp / reset page index when data set changes
  useEffect(() => {
    setPageIndex((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);
  useEffect(() => {
    // Reset to first page on new search term for better UX
    setPageIndex(0);
  }, [search]);

  // Buy handler placeholder
  const handleBuy = useCallback((p) => console.log('Buy', p.id), []);
  // Real add-to-cart handler (optimistic + backend sync)
  const handleAddToCart = useCallback(
    async (p) => {
      if (!p) return;
      try {
        // Optimistic local add
        dispatch(
          addItem({
            productId: p.id,
            name: p.name,
            price: p.price,
            quantity: 1,
            imageUrl: p.imageUrl,
          })
        );
        // Backend add (attach backend id if success)
        try {
          const resp = await addToCartApi(p.id, 1);
          if (resp?.id) {
            dispatch(
              attachBackendId({ productId: p.id, backendItemId: resp.id })
            );
          }
        } catch (apiErr) {
          // 401 or other failure: keep optimistic item; hydration later can reconcile
          console.warn('Add to cart API failed', apiErr?.message);
        }
        // Fire analytics/log (non-blocking)
        try {
          await logCartAdd(p);
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.warn('Add to cart failed', err?.message);
      }
    },
    [dispatch]
  );
  const handleMoreLikeThis = useCallback(
    (p) => console.log('More like', p.id),
    []
  );

  const handlePrevPage = useCallback(() => {
    setPageIndex((prev) => Math.max(0, prev - 1));
  }, []);
  const handleNextPage = useCallback(() => {
    setPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  return (
    <Col className="d-flex flex-column w-100 p-0">
      <SearchbarRow
        searchId="featuredSearch"
        placeholder="Search All Products"
        sectionTitle={
          activeCategoryName
            ? `Category: ${activeCategoryName}`
            : 'Featured Products'
        }
        filterButton
        onSearch={handleSearch}
      />

      {activeCategoryId && !search && (
        <div className="d-flex align-items-center gap-2 px-1">
          <span
            className="badge"
            style={{ fontSize: '.65rem', ...theme.schemes.emphasis }}
          >
            Filtering by category
          </span>
          <button
            type="button"
            className="btn btn-sm"
            style={{ ...theme.button.highlight }}
            onClick={onClearCategory}
          >
            Clear
          </button>
        </div>
      )}

      <div className="d-flex flex-column w-100">
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
          onSelect={setSelected}
          onAddToCart={handleAddToCart}
          loading={loading}
          error={error}
        />
      </div>

      <ProductPopup
        product={selected}
        show={!!selected}
        onClose={handleClosePopup}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuy}
        onMoreLikeThis={handleMoreLikeThis}
      />
    </Col>
  );
}

export default FeaturedProducts;
