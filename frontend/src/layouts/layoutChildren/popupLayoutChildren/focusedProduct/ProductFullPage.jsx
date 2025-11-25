import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { useTheme } from '@resources/themes/themeContext';
import NavBar from '../../navbar/NavBar.jsx';
import PopupLayout from '../../../mainComponents/PopupLayout.jsx';
import FocusedProduct from './FocusedProduct.jsx';
import { listProducts, getProduct } from '@api/catalog';
import { normalizeProducts } from '@utils/helpers';
import { useDispatch } from 'react-redux';
import { addItem, attachBackendId } from '@redux/cart/cartSlice';
import { addToCart as addToCartApi } from '@api/cart';
import { logCartAdd } from '@api/events';

function ProductFullPage() {
  const { int: productId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Attempt direct fetch first
        let direct = null;
        try {
          direct = await getProduct(productId);
        } catch {
          /* ignore */
        }
        if (direct && !ignore) {
          const normalized = normalizeProducts([direct]);
          setProduct(normalized[0]);
          setLoading(false);
          return;
        }
        // Fallback to list
        const data = await listProducts();
        const normalized = normalizeProducts(Array.isArray(data) ? data : []);
        const match = normalized.find(
          (p) => String(p.id) === String(productId)
        );
        if (!ignore) setProduct(match || null);
        if (!match && !ignore) setError('Product not found');
      } catch (e) {
        if (!ignore) setError(e.message || 'Failed to load product');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (productId) load();
    return () => {
      ignore = true;
    };
  }, [productId]);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    try {
      dispatch(
        addItem({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
        })
      );
      try {
        const resp = await addToCartApi(product.id, 1);
        if (resp?.id) {
          dispatch(
            attachBackendId({ productId: product.id, backendItemId: resp.id })
          );
        }
      } catch {}
      try {
        await logCartAdd(product);
      } catch {}
    } catch (err) {
      console.warn('Add to cart failed', err?.message);
    }
  }, [product, dispatch]);

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
        <div
          className="w-100"
          style={{ marginBottom: '2vh' }}
        >
          <NavBar setPopup={setPopup} />
        </div>
        <div
          className="d-flex flex-column w-100 h-100"
          style={{
            padding: '0.75rem',
            fontSize: '.75rem',
            borderRadius: theme.props?.bR_more || 8,
          }}
        >
          {loading && (
            <div
              className="d-flex align-items-center gap-2"
              style={{ fontSize: '.75rem' }}
            >
              <Spinner
                size="sm"
                animation="border"
              />{' '}
              Loading product…
            </div>
          )}
          {error && !loading && (
            <div
              className="d-flex flex-column align-items-start gap-2 p-3 border rounded"
              style={{
                fontSize: '.75rem',
                background: theme.mode === 'dark' ? '#161b22' : '#fff',
                borderColor: theme.colors.details,
                maxWidth: 480,
              }}
            >
              <div
                className="fw-semibold"
                style={{ fontSize: '.85rem' }}
              >
                Not Found
              </div>
              <div style={{ fontSize: '.7rem' }}>{error}</div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => navigate('/products')}
                  style={{ fontSize: '.65rem' }}
                >
                  Back to Catalog
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => navigate('/')}
                  style={{ fontSize: '.65rem' }}
                >
                  Home
                </button>
              </div>
            </div>
          )}
          {!loading && product && (
            <FocusedProduct
              product={product}
              onAddToCart={handleAddToCart}
              onBuyNow={() => console.log('Buy Now', product.id)}
              onMoreLikeThis={() =>
                navigate(
                  `/products?category=${encodeURIComponent(product._raw?.category_id || '')}`
                )
              }
              onClose={() => navigate('/products')}
            />
          )}
        </div>
      </Container>
      {popup && <PopupLayout>{popup}</PopupLayout>}
    </>
  );
}

export default ProductFullPage;
