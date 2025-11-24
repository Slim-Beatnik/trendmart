import { Routes, Route, Outlet } from 'react-router-dom';
import MasterLayout from '@main/MasterLayout';
import FocusedProduct from '@children/popupLayoutChildren/focusedProduct/FocusedProduct';
import Profile from '@children/popupLayoutChildren/profileSettings/Profile';
import Address from '@children/popupLayoutChildren/profileSettings/Address';
import ProtectedURLs from '@children/securityWrapper/ProtectedURLs';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import StyleGuide from '@resources/themes/StyleGuide';
import ShippingPopup from '@children/popupLayoutChildren/checkout/ShippingPopup';
import PaymentPopup from '@children/popupLayoutChildren/checkout/PaymentPopup';
import OrderConfirmation from '@children/popupLayoutChildren/checkout/OrderConfirmation';
import { useDispatch, useSelector } from 'react-redux';
import { hydrateCart } from '@redux/cart/cartSlice';
import { getCart } from '@api/cart';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await getCart();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (!ignore && items.length) {
          dispatch(hydrateCart(items));
        }
      } catch (e) {
        console.warn('Cart hydration failed', e);
      }
    };
    load();
    return () => { ignore = true; };
  }, [isAuthenticated, dispatch]);

  return (
    <>
      <Routes>
        <Route
          path="/styleguide"
          element={<StyleGuide />}
        />
        <Route
          path="/"
          element={<MasterLayout state={{ popup, setPopup }} />}
        >
          <Route element={<ProtectedURLs />}>
            <Route
              path="/product/:int"
              element={
                <FocusedProduct
                  onAddToCart={null}
                  onBuyNow={null}
                  onWishlist={null}
                  onMoreLikeThis={null}
                  onClose={null}
                />
              }
            />

            <Route
              path="/profile"
              element={<Profile />}
            >
              <Route
                index
                element={<Address />}
              />
              {/* <Route
                path="profile/contact-info"
                element={<ContactInfo />}
              /> */}
              <Route
                path="profile/address"
                element={<Address />}
              />
              {/* <Route
                path="profile/security"
                element={<Security />}
              /> */}
            </Route>

            <Route
              path="/checkout/shipping"
              element={<ShippingPopup />}
            />
            <Route
              path="/checkout/payment/:orderId"
              element={<PaymentPopup />}
            />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
