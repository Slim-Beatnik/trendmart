import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus } from '@redux/auth/authSlice';
import { Outlet, useNavigate } from 'react-router-dom';
import { setStatus, clearStatus } from '@redux/status/statusSlice';
import { AUTH_TOKEN_KEY } from '@api/api';

function ProtectedURLs() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, status, user } = useSelector((state) => state.auth);

  // Kick off auth check once
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) {
      dispatch(checkAuthStatus());
    } else {
      navigate('/');
    }
  }, [dispatch, navigate]);

  // Manage global status text outside of render
  useEffect(() => {
    if (status === 'loading') {
      dispatch(setStatus({ message: 'Checking session...', variant: 'info' }));
    } else {
      // clear after success or failure
      dispatch(clearStatus());
    }
  }, [status, dispatch]);

  // Redirect only after check finishes
  useEffect(() => {
    if (status === 'failed' || (status === 'succeeded' && !isAuthenticated)) {
      navigate('/');
    }
  }, [isAuthenticated, status, navigate]);

  return <Outlet />;
}

export default ProtectedURLs;
