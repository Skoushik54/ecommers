import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { AppContext } from '@/App';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, setUser, setCartOpen, API } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleScrollToAbout = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById('founder-story');
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById('founder-story');
      element?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" data-testid="logo-link" className="text-3xl lg:text-4xl font-bold tracking-tighter text-white">
            RARE
          </Link>

          <div className="hidden lg:flex items-center gap-12">
            <Link to="/products" data-testid="products-nav-link" className="text-white/60 hover:text-white font-mono text-sm uppercase transition-colors">
              Collection
            </Link>
            <a href="#founder-story" onClick={handleScrollToAbout} data-testid="about-nav-link" className="text-white/60 hover:text-white font-mono text-sm uppercase transition-colors">
              About
            </a>
            {user ? (
              <>
                <Link to="/profile" data-testid="profile-nav-link" className="text-white/60 hover:text-white font-mono text-sm uppercase transition-colors">
                  {user.name}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" data-testid="admin-nav-link" className="text-[#D00000] hover:text-white font-mono text-sm uppercase transition-colors">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} data-testid="logout-button" className="text-white/60 hover:text-white font-mono text-sm uppercase transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" data-testid="login-nav-link" className="text-white/60 hover:text-white font-mono text-sm uppercase transition-colors">
                Login
              </Link>
            )}
            <button
              data-testid="cart-button"
              onClick={() => setCartOpen(true)}
              className="text-white hover:text-[#D00000] transition-colors"
            >
              <ShoppingCart size={20} />
            </button>
          </div>

          <button
            data-testid="mobile-menu-toggle"
            className="lg:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div data-testid="mobile-menu" className="lg:hidden bg-[#050505] border-t border-white/10">
          <div className="px-6 py-6 space-y-4">
            <Link to="/products" data-testid="mobile-products-link" className="block text-white/60 hover:text-white font-mono text-sm uppercase">
              Collection
            </Link>
            <a href="#founder-story" onClick={handleScrollToAbout} data-testid="mobile-about-link" className="block text-white/60 hover:text-white font-mono text-sm uppercase">
              About
            </a>
            {user ? (
              <>
                <Link to="/profile" data-testid="mobile-profile-link" className="block text-white/60 hover:text-white font-mono text-sm uppercase">
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" data-testid="mobile-admin-link" className="block text-[#D00000] hover:text-white font-mono text-sm uppercase">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} data-testid="mobile-logout-button" className="block text-white/60 hover:text-white font-mono text-sm uppercase">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" data-testid="mobile-login-link" className="block text-white/60 hover:text-white font-mono text-sm uppercase">
                Login
              </Link>
            )}
            <button
              data-testid="mobile-cart-button"
              onClick={() => { setCartOpen(true); setMobileMenuOpen(false); }}
              className="block text-white/60 hover:text-white font-mono text-sm uppercase"
            >
              Cart
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
