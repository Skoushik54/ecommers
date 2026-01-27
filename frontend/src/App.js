import React, { useEffect, useState, useRef } from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import Lenis from "@studio-freight/lenis";
import { Toaster } from "@/components/ui/sonner";
import "leaflet/dist/leaflet.css";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ScrollStory from "@/components/ScrollStory";
import FeaturedProducts from "@/components/FeaturedProducts";
import TrustSection from "@/components/TrustSection";
import FounderStory from "@/components/FounderStory";
import Footer from "@/components/Footer";
import ProductListing from "@/pages/ProductListing";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/components/Cart";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderConfirmation from "@/pages/OrderConfirmation";
import ProfilePage from "@/pages/ProfilePage";
import AdminDashboard from "@/pages/AdminDashboard";
import LoginPage from "@/pages/LoginPage";
import AuthCallback from "@/components/AuthCallback";
import Preloader from "@/components/Preloader";

import { GoogleOAuthProvider } from '@react-oauth/google';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID";

export const AppContext = React.createContext();





function AppRouter() {
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartKey, setCartKey] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
          // credentials: 'include' // No longer relying on cookie
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 401) {
          // Only logout on explicit 401
          localStorage.removeItem('token');
          setUser(null);
        }
        // For other errors (500, network), keep the token and retry later
      } catch (error) {
        console.log("Auth check skipped due to error:", error);
        // Do NOT remove token here. Network error != Invalid session
      } finally {
        setIsLoading(false);
      }
    };

    if (!location.hash?.includes('session_id=')) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback setUser={setUser} />;
  }

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <AppContext.Provider value={{ user, setUser, cartOpen, setCartOpen, API, isLoading, cartKey, triggerCartUpdate: () => setCartKey(prev => prev + 1) }}>
      <div className="App">
        <CustomCursor />
        <Navbar />
        <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListing />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
        <Footer />
        <Toaster />
      </div>
    </AppContext.Provider>
  );
}

const HomePage = () => {
  return (
    <>
      <Hero />
      <ScrollStory />
      <FeaturedProducts />
      <TrustSection />
      <FounderStory />
    </>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = React.useContext(AppContext);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white font-mono">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isLoading } = React.useContext(AppContext);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white font-mono">LOADING...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
