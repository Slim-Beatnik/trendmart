import { Routes, Route, Navigate } from 'react-router-dom';
import MasterLayout from '@main/MasterLayout';
import FocusedProduct from '@children/popupLayoutChildren/focusedProduct/FocusedProduct';
import Profile from '@children/popupLayoutChildren/profileSettings/Profile';
import Address from '@children/popupLayoutChildren/profileSettings/Address';
import ProtectedURLs from '@children/securityWrapper/ProtectedURLs';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import StyleGuide from '@resources/themes/StyleGuide';
import ShippingPopup from '@children/popupLayoutChildren/checkout/ShippingPopup';
import PaymentPopup from '@children/popupLayoutChildren/checkout/PaymentPopup';
import ContactInfo from '@children/popupLayoutChildren/profileSettings/ContactInfo';

function App() {
  const [popup, setPopup] = useState(null);

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
          <Route element={<ProtectedURLs />}>

            <Route path="/profile" element={<Navigate to="/profile/contact-info" />} />

            <Route path="/profile/contact-info" element={<Profile />} />
            <Route path="/profile/address" element={<Profile />} />
            <Route path="/profile/security" element={<Profile />} />

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
