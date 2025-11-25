import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Stack from 'react-bootstrap/Stack';
import SearchbarRow from '../sectionSearchbar/SearchbarRow';
import { Container } from 'react-bootstrap';
import { listCategories } from '@api/catalog';
import HoverCategory from './productsChildren/HoverCategory';
import { useTheme } from '@resources/themes/themeContext';

function ProductCategories({ onSelectCategory, activeCategoryId }) {
  const { theme } = useTheme();
  const [categories, setCategories] = useState(null); // null = loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await listCategories();
        if (!ignore) setCategories(result);
      } catch (e) {
        if (!ignore) setError(e.message || 'Failed to load categories');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, []);

  const placeholderCategories = [
    { id: 'ph-1', name: 'Category 1', slug: 'category-1' },
    { id: 'ph-2', name: 'Category 2', slug: 'category-2' },
    { id: 'ph-3', name: 'Category 3', slug: 'category-3' },
    { id: 'ph-4', name: 'Category 4', slug: 'category-4' },
  ];

  const displayedCategories = categories?.length
    ? categories
    : placeholderCategories;

  // Prepend synthetic "All Categories" option for direct full catalog access
  const fullList = [
    { id: '', name: 'All Categories', slug: 'all-categories' },
    ...displayedCategories,
  ];

  const handleSelect = useCallback(
    (cat) => {
      if (!cat) return;
      // Empty id = All Categories (unfiltered catalog)
      if (cat.id === '') {
        navigate('/products');
        onSelectCategory?.(null);
        return;
      }
      // If selecting currently active one, toggle to unfiltered
      if (activeCategoryId && cat.id === activeCategoryId) {
        navigate('/products');
        onSelectCategory?.(null);
        return;
      }
      navigate(`/products?category=${encodeURIComponent(cat.id)}`);
      onSelectCategory?.(cat);
    },
    [activeCategoryId, navigate, onSelectCategory]
  );

  return (
    <Container
      fluid
      className="p-0 m-0"
      style={{ height: '100%' }}
    >
      <div className="d-flex flex-column ms-3">
        <SearchbarRow
          searchId="subcategorySearch"
          placeholder="Filter by category"
        />
      </div>
      <Stack
        direction="vertical"
        className="d-flex justify-content-start align-items-stretch gap-2 m-0 p-0 w-100"
      >
        {/* Always visible All Categories quick link (button alternative) */}
        <button
          type="button"
          className="btn btn-sm mt-2 align-self-start"
          onClick={() => {
            onSelectCategory?.(null);
            navigate('/products');
          }}
          style={{ fontSize: '.65rem' }}
        >
          All Categories
        </button>
        {loading && (
          <div className="small text-muted px-3">Loading categories…</div>
        )}
        {error && !loading && (
          <div className="small text-danger px-3">{error}</div>
        )}
        {fullList.map((cat) => {
          const active =
            (cat.id === '' &&
              location.pathname === '/products' &&
              !activeCategoryId) ||
            (activeCategoryId === cat.id && cat.id !== '');
          return (
            <HoverCategory
              key={cat.id}
              linksTo={null}
              onClick={() => handleSelect(cat)}
              style={{
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
                background: active ? theme.colors.lightBg : 'transparent',
                padding: '.35rem .75rem',
                borderRadius: 4,
                border: active
                  ? `1px solid ${theme.colors.details}`
                  : '1px solid transparent',
              }}
            >
              {cat.name}
            </HoverCategory>
          );
        })}
      </Stack>
    </Container>
  );
}

export default ProductCategories;
