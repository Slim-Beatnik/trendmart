import { Routes, Route, Navigate } from 'react-router-dom';
import MasterLayout from '@main/MasterLayout';
import FocusedProduct from '@children/popupLayoutChildren/focusedProduct/FocusedProduct';
import Profile from '@children/popupLayoutChildren/profileSettings/Profile';
import ProtectedURLs from '@children/securityWrapper/ProtectedURLs';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect } from 'react';
import StyleGuide from '@resources/themes/StyleGuide';
import ShippingPopup from '@children/popupLayoutChildren/checkout/ShippingPopup';
import PaymentPopup from '@children/popupLayoutChildren/checkout/PaymentPopup';
import OrderConfirmation from '@children/popupLayoutChildren/checkout/OrderConfirmation';
import { useDispatch, useSelector } from 'react-redux';
import { hydrateCart } from '@redux/cart/cartSlice';
import { getCart } from '@api/cart';
import AllProductsPage from '@children/products/allProducts/AllProductsPage';
import ProductFullPage from '@children/popupLayoutChildren/focusedProduct/ProductFullPage';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await getCart();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (!ignore) dispatch(hydrateCart(items));
      } catch (e) {
        if (!ignore) dispatch(hydrateCart([]));
      }
    };
    load();
    return () => { ignore = true; };
  }, [isAuthenticated, dispatch]);

  return (
    <>
      <Routes>
        <Route path="/styleguide" element={<StyleGuide />} />
        {/* Standalone full catalog page */}
        <Route path="/products" element={<AllProductsPage />} />
        <Route path="/products/:int" element={<ProductFullPage />} />
        {/* Home + popup routes */}
        <Route path="/" element={<MasterLayout />}>
          <Route
            path="product/:int"
            element={<FocusedProduct onAddToCart={null} onBuyNow={null} onWishlist={null} onMoreLikeThis={null} onClose={null} />}
          />
          <Route element={<ProtectedURLs />}>
            <Route path="profile" element={<Navigate to="/profile/contact-info" replace />} />
            <Route path="profile/contact-info" element={<Profile />} />
            <Route path="profile/address" element={<Profile />} />
            <Route path="profile/security" element={<Profile />} />
            <Route path="checkout/shipping" element={<ShippingPopup />} />
            <Route path="checkout/payment/:orderId" element={<PaymentPopup />} />
            <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
