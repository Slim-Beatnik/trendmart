import { useState, useMemo, useCallback, useEffect } from 'react';

export function useCatalogFilters(
  products,
  initialCategoryId = '',
  initialSubcategoryId = '',
  initialSearch = ''
) {
  const [categoryId, setCategoryId] = useState(initialCategoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(
    initialSubcategoryId || ''
  );
  const [search, setSearch] = useState(initialSearch || '');

  // Keep internal categoryId in sync if initialCategoryId prop changes
  useEffect(() => {
    // Category external sync
    if (initialCategoryId && String(initialCategoryId) !== String(categoryId)) {
      setCategoryId(String(initialCategoryId));
      setSubcategoryId('');
    }
    if (!initialCategoryId && categoryId) {
      setCategoryId('');
      setSubcategoryId('');
    }
    // Subcategory external sync (only if category matches or is empty)
    if (initialSubcategoryId && initialSubcategoryId !== subcategoryId) {
      setSubcategoryId(String(initialSubcategoryId));
    }
    if (!initialSubcategoryId && subcategoryId) {
      setSubcategoryId('');
    }
    // Search external sync
    if (initialSearch !== undefined && initialSearch !== search) {
      setSearch(initialSearch);
    }
  }, [initialCategoryId, initialSubcategoryId, initialSearch]);

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const raw = p._raw || {};
      const catName = raw.category_name || raw.category || raw.categoryName;
      const catId = raw.category_id || raw.categoryId || catName;
      if (catId && catName) map.set(String(catId), String(catName));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const subcategories = useMemo(() => {
    if (!categoryId) return [];
    const map = new Map();
    products.forEach((p) => {
      const raw = p._raw || {};
      const catIdRaw =
        raw.category_id || raw.categoryId || raw.category || raw.category_name;
      if (String(catIdRaw) !== String(categoryId)) return;
      const subName =
        raw.subcategory_name || raw.subcategory || raw.subCategoryName;
      const subId = raw.subcategory_id || raw.subcategoryId || subName;
      if (subId && subName) map.set(String(subId), String(subName));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products, categoryId]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryId) {
      list = list.filter((p) => {
        const r = p._raw || {};
        const catIdRaw =
          r.category_id || r.categoryId || r.category || r.category_name;
        return String(catIdRaw) === String(categoryId);
      });
    }
    if (subcategoryId) {
      list = list.filter((p) => {
        const r = p._raw || {};
        const subIdRaw =
          r.subcategory_id ||
          r.subcategoryId ||
          r.subcategory ||
          r.subcategory_name;
        return String(subIdRaw) === String(subcategoryId);
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, categoryId, subcategoryId, search]);

  const clearFilters = useCallback(() => {
    setCategoryId('');
    setSubcategoryId('');
    setSearch('');
  }, []);

  return {
    categoryId,
    setCategoryId,
    subcategoryId,
    setSubcategoryId,
    search,
    setSearch,
    categories,
    subcategories,
    filteredProducts,
    clearFilters,
  };
}

export default useCatalogFilters;
