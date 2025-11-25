import { useEffect, useState, useCallback } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useTheme } from '@resources/themes/themeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import PopupLayout from '../../../mainComponents/PopupLayout.jsx';
import NavBar from '../../navbar/NavBar.jsx';
import { listProducts } from '@api/catalog';
import { normalizeProducts } from '@utils/helpers';
import ProductFiltersPanel from './ProductFiltersPanel';
import useCatalogFilters from './useCatalogFilters';
import usePagination from './usePagination';
import ProductCard from '../productsChildren/ProductCard';
import ProductPopup from '../productsChildren/ProductPopup';
import { useDispatch } from 'react-redux';
import { addItem, attachBackendId } from '@redux/cart/cartSlice';
import { addToCart as addToCartApi } from '@api/cart';
import { logCartAdd } from '@api/events';

function AllProductsPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [popup, setPopup] = useState(null);

    const [rawProducts, setRawProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [viewMode, setViewMode] = useState('popup'); // 'popup' | 'focus'

    useEffect(() => {
        let ignore = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await listProducts();
                if (!ignore) setRawProducts(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!ignore) setError(e.message || 'Failed to load products');
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        load();
        return () => { ignore = true; };
    }, []);

    const normalized = normalizeProducts(rawProducts);

    // Read initial category from query parameter
    const [searchParams, setSearchParams] = useSearchParams();
    const queryCategory = searchParams.get('category') || '';

    const {
        categoryId, setCategoryId,
        subcategoryId, setSubcategoryId,
        search, setSearch,
        categories, subcategories,
        filteredProducts,
        clearFilters
    } = useCatalogFilters(normalized, queryCategory);

    // Keep hook categoryId synced with query changes (e.g., user edits URL or navigates back)
    useEffect(() => {
        if (queryCategory !== categoryId) {
            // If query removed, clear filters to stay consistent
            if (!queryCategory) {
                setCategoryId('');
                setSubcategoryId('');
            } else {
                setCategoryId(queryCategory);
                setSubcategoryId('');
            }
        }
    }, [queryCategory]);

    // Pagination hook on filtered list
    const {
        pageIndex,
        setPageIndex,
        pageSize,
        setPageSize,
        totalItems,
        totalPages,
        visibleItems
    } = usePagination(filteredProducts, 16);

    // Reset to first page on filter change
    useEffect(() => {
        setPageIndex(0);
    }, [categoryId, subcategoryId, search, pageSize, setPageIndex]);

    const handleAddToCart = useCallback(async (p) => {
        if (!p) return;
        try {
            dispatch(addItem({
                productId: p.id,
                name: p.name,
                price: p.price,
                quantity: 1,
                imageUrl: p.imageUrl
            }));
            try {
                const resp = await addToCartApi(p.id, 1);
                if (resp?.id) {
                    dispatch(attachBackendId({ productId: p.id, backendItemId: resp.id }));
                }
            } catch (apiErr) {
                console.warn('Add to cart API failed', apiErr?.message);
            }
            try { await logCartAdd(p); } catch { /* ignore */ }
        } catch (err) {
            console.warn('Add to cart failed', err?.message);
        }
    }, [dispatch]);

    const handleSelect = useCallback((p) => {
        if (!p) return;
        if (viewMode === 'focus') {
            try { sessionStorage.setItem('catalogScroll', String(window.scrollY || 0)); } catch { }
            navigate(`/products/${p.id}`);
        } else {
            setSelected(p);
        }
    }, [viewMode, navigate]);

    // Restore scroll position if stored
    useEffect(() => {
        const saved = sessionStorage.getItem('catalogScroll');
        if (saved) {
            const y = parseInt(saved, 10);
            if (!isNaN(y)) {
                window.scrollTo({ top: y, behavior: 'auto' });
            }
            // One-time restore
            sessionStorage.removeItem('catalogScroll');
        }
    }, []);

    const closePopup = useCallback(() => setSelected(null), []);
    const showEmpty = !loading && totalItems === 0;

    const prevPage = () => setPageIndex(i => Math.max(0, i - 1));
    const nextPage = () => setPageIndex(i => Math.min(totalPages - 1, i + 1));
    const jumpTo = (i) => setPageIndex(i);

    return (
        <>
            <Container
                fluid
                className="m-0 p-0"
                style={{
                    minHeight: '100vh',
                    backgroundImage: `radial-gradient(circle farthest-corner at bottom, ${theme.colors.details} 60%, ${theme.colors.lightBg}44 100%)`,
                    backgroundColor: theme.colors.lightBg,
                }}
            >
                <div className="w-100" style={{ marginBottom: '2vh' }}>
                    <NavBar setPopup={setPopup} />
                </div>
                <div
                    className="d-flex flex-column w-100 h-100"
                    style={{
                        padding: '0.75rem',
                        background: theme.mode === 'dark' ? '#010409' : '#f7f9fb',
                        fontSize: '.75rem',
                        borderRadius: theme.props?.bR_more || 8
                    }}
                >
                    <Row className="g-3">
                        <Col xs={12} md={3} lg={3}>
                            <ProductFiltersPanel
                                categories={categories}
                                subcategories={subcategories}
                                categoryId={categoryId}
                                setCategoryId={setCategoryId}
                                subcategoryId={subcategoryId}
                                setSubcategoryId={setSubcategoryId}
                                search={search}
                                setSearch={setSearch}
                                onClear={() => {
                                    clearFilters();
                                    setSearchParams({});
                                }}
                            />
                            <div className="mt-3 d-flex flex-column gap-2">
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    style={{ fontSize: '.65rem', ...theme.buttons.emphasis }}
                                    onClick={() => setViewMode(m => m === 'popup' ? 'focus' : 'popup')}
                                >
                                    View Mode: {viewMode === 'popup' ? 'Popup' : 'Full Page'}
                                </Button>
                                <Form.Group className="d-flex flex-column">
                                    <Form.Label style={{ fontSize: '.65rem', marginBottom: 2 }}>Page Size</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={pageSize}
                                        onChange={e => setPageSize(Number(e.target.value))}
                                        style={{ fontSize: '.7rem' }}
                                    >
                                        {[8, 16, 24, 32].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                <div style={{ fontSize: '.6rem', color: '#555' }}>
                                    {totalItems} product{totalItems === 1 ? '' : 's'} total.
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    style={{ fontSize: '.65rem' }}
                                    onClick={() => navigate('/')}
                                >
                                    Back to Highlights
                                </Button>
                            </div>
                        </Col>

                        <Col xs={12} md={9} lg={9} className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 style={{ fontSize: '.9rem', margin: 0 }}>All Products</h5>
                                {loading && (
                                    <div className="d-flex align-items-center gap-2" style={{ fontSize: '.65rem' }}>
                                        <Spinner size="sm" animation="border" /> Loading
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="text-danger mb-2" style={{ fontSize: '.65rem' }}>
                                    {error}
                                </div>
                            )}

                            {showEmpty && !error && (
                                <div className="text-muted" style={{ fontSize: '.7rem' }}>
                                    No products match the current filters.
                                </div>
                            )}

                            {!showEmpty && (
                                <>
                                    <div
                                        className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2"
                                        style={{ fontSize: '.65rem' }}
                                    >
                                        <div>
                                            Page {totalItems === 0 ? 0 : pageIndex + 1} of {totalPages} ({visibleItems.length} shown)
                                        </div>
                                        <div className="d-flex align-items-center gap-1 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="outline-secondary"
                                                disabled={pageIndex === 0}
                                                onClick={prevPage}
                                                style={{ fontSize: '.6rem' }}
                                            >
                                                Prev
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline-secondary"
                                                disabled={pageIndex >= totalPages - 1}
                                                onClick={nextPage}
                                                style={{ fontSize: '.6rem' }}
                                            >
                                                Next
                                            </Button>
                                            <div className="d-flex gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i)
                                                    .filter(i => {
                                                        if (totalPages <= 8) return true;
                                                        if (i < 3) return true;
                                                        if (i >= totalPages - 2) return true;
                                                        if (Math.abs(i - pageIndex) <= 1) return true;
                                                        return false;
                                                    })
                                                    .map(i => (
                                                        <Button
                                                            key={i}
                                                            size="sm"
                                                            variant={i === pageIndex ? 'primary' : 'outline-secondary'}
                                                            onClick={() => jumpTo(i)}
                                                            style={{ fontSize: '.55rem', padding: '2px 6px' }}
                                                        >
                                                            {i + 1}
                                                        </Button>
                                                    ))}
                                                {totalPages > 8 && pageIndex < totalPages - 4 && (
                                                    <span style={{ fontSize: '.55rem' }}>…</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Row className="gx-3 gy-3 m-0">
                                        {visibleItems.map(p => (
                                            <Col
                                                key={p.id}
                                                xs={12} sm={6} md={4} lg={3}
                                                className="d-flex"
                                            >
                                                <ProductCard
                                                    product={p}
                                                    onView={() => handleSelect(p)}
                                                    onAddToCart={handleAddToCart}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            )}
                        </Col>
                    </Row>

                    <ProductPopup
                        product={selected}
                        show={!!selected}
                        onClose={closePopup}
                        onAddToCart={handleAddToCart}
                        onBuyNow={(p) => console.log('Buy Now', p?.id)}
                        onMoreLikeThis={(p) => navigate(`/products/${p.id}`)}
                    />
                </div>
            </Container>
            {popup && <PopupLayout>{popup}</PopupLayout>}
        </>
    );
}

export default AllProductsPage;