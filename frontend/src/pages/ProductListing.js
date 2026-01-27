import React, { useEffect, useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Search, Filter, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { AppContext } from '@/App';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';

const ProductListing = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { API, setCartOpen, triggerCartUpdate } = useContext(AppContext);

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'All',
    search: searchParams.get('search') || '',
    sort: 'newest',
    minPrice: '',
    maxPrice: ''
  });

  // Available Categories (Dynamic in a real app, hardcoded for now or derived)
  const [categories, setCategories] = useState(['All', 'T-Shirts', 'Hoodies', 'Jackets', 'Accessories']);

  // Fetch Products with Filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);

      const response = await fetch(`${API}/products?${params.toString()}`);
      const data = await response.json();
      setProducts(data);

      // Extract categories dynamically if needed
      // const dynamicCats = ['All', ...new Set(data.map(p => p.category))];
      // setCategories(dynamicCats);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error("Could not load products");
    } finally {
      setLoading(false);
    }
  }, [API, filters]); // Re-fetch when filters change

  // Debounced Search Handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 500),
    []
  );

  // Initial Fetch & Update on Filter Change
  useEffect(() => {
    fetchProducts();

    // Update URL params
    const params = {};
    if (filters.category !== 'All') params.category = filters.category;
    if (filters.search) params.search = filters.search;
    setSearchParams(params);

  }, [fetchProducts, filters.category, filters.sort, filters.minPrice, filters.maxPrice, filters.search]); // Be careful with debounced search

  const handleQuickAdd = async (e, product) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Cart-Session-ID': localStorage.getItem('cart_session_id') // Send Session ID
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: product.product_id,
          quantity: 1,
          size: product.sizes?.[0] || 'M'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to add to cart');
      }

      // Capture Session ID
      if (data.session_id) {
        localStorage.setItem('cart_session_id', data.session_id);
      }

      toast.success('Added to cart!');
      triggerCartUpdate();
      setCartOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-20">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="bg-white text-black p-4 rounded-full shadow-lg flex items-center gap-2 font-bold"
        >
          <Filter size={20} /> FILTERS
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 flex flex-col lg:flex-row gap-12">

        {/* --- SIDEBAR FILTERS --- */}
        <motion.div
          className={`fixed inset-0 z-50 bg-[#0A0A0A] p-8 lg:static lg:bg-transparent lg:p-0 lg:w-64 lg:block overflow-y-auto ${showMobileFilters ? 'block' : 'hidden'}`}
          initial={false}
          animate={showMobileFilters ? { x: 0 } : { x: 0 }} // Simplified for desktop
        >
          <div className="flex justify-between items-center lg:hidden mb-8">
            <h2 className="text-2xl font-bold text-white">FILTERS</h2>
            <button onClick={() => setShowMobileFilters(false)} className="text-white"><X /></button>
          </div>

          <div className="space-y-10">
            {/* Search (Mobile/Sidebar) */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                defaultValue={filters.search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 p-3 pl-10 text-white rounded focus:outline-none focus:border-white/40"
              />
              <Search className="absolute left-3 top-3.5 text-white/40" size={16} />
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-mono text-white/40 uppercase mb-4 tracking-widest">Category</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${filters.category === cat ? 'bg-white border-white' : 'border-white/20 group-hover:border-white'}`}>
                      {filters.category === cat && <div className="w-2 h-2 bg-black" />}
                    </div>
                    <input
                      type="radio"
                      name="category"
                      className="hidden"
                      checked={filters.category === cat}
                      onChange={() => setFilters({ ...filters, category: cat })}
                    />
                    <span className={`text-sm ${filters.category === cat ? 'text-white font-bold' : 'text-white/60 group-hover:text-white'}`}>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-xs font-mono text-white/40 uppercase mb-4 tracking-widest">Price Range</h3>
              <div className="flex gap-4">
                <input
                  placeholder="Min"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full bg-[#1A1A1A] border border-white/10 p-2 text-white text-sm rounded"
                />
                <input
                  placeholder="Max"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full bg-[#1A1A1A] border border-white/10 p-2 text-white text-sm rounded"
                />
              </div>
            </div>

            {/* Sort (Mobile Only - usually desktop has top bar) */}
            <div className="lg:hidden">
              <h3 className="text-xs font-mono text-white/40 uppercase mb-4 tracking-widest">Sort By</h3>
              <select
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                className="w-full bg-[#1A1A1A] border border-white/10 p-3 text-white rounded"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* --- MAIN GRID --- */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white uppercase mb-2">Shop</h1>
              <p className="text-white/40 font-mono text-sm">Showing {products.length} results</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 relative group">
                <span className="text-white/60 text-sm font-mono uppercase">Sort By:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                  className="bg-transparent text-white font-bold uppercase focus:outline-none cursor-pointer"
                >
                  <option className="bg-black" value="newest">Newest</option>
                  <option className="bg-black" value="price_asc">Price: Low to High</option>
                  <option className="bg-black" value="price_desc">Price: High to Low</option>
                  <option className="bg-black" value="name_asc">Name: A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] bg-white/5 rounded"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-white/40 font-mono text-lg">No products found matching your criteria.</p>
              <button onClick={() => setFilters({ category: 'All', search: '', sort: 'newest', minPrice: '', maxPrice: '' })} className="mt-4 btn-outline">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16">
              {products.map((product, index) => (
                <div
                  key={product.product_id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/products/${product.product_id}`)}
                >
                  <div className="relative overflow-hidden aspect-[3/4] bg-[#1A1A1A] mb-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Overlay & Quick Add */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="absolute bottom-4 right-4 bg-white text-black p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#D00000] hover:text-white z-10"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight group-hover:underline decoration-white/30 underline-offset-4">
                      {product.name}
                    </h3>
                    <p className="text-white/60 font-mono text-xs">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListing;
