import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Truck, Shield, ArrowLeft } from 'lucide-react';
import { AppContext } from '@/App';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { API, setCartOpen, user, triggerCartUpdate } = useContext(AppContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          fetch(`${API}/products/${productId}`),
          fetch(`${API}/products/${productId}/reviews`)
        ]);

        const productData = await productRes.json();
        const reviewsData = await reviewsRes.json();

        setProduct(productData);
        setReviews(reviewsData);
        setSelectedSize(productData.sizes[0]);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId, API]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    try {
      await fetch(`${API}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          quantity,
          size: selectedSize
        })
      });
      toast.success('Added to cart!');
      triggerCartUpdate();
      setCartOpen(true);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <div className="text-white font-mono">LOADING...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <div className="text-white font-mono">PRODUCT NOT FOUND</div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div data-testid="product-detail-page" className="min-h-screen bg-[#050505] pt-32 pb-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <button
          data-testid="back-button"
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 font-mono text-sm"
        >
          <ArrowLeft size={16} />
          BACK TO COLLECTION
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="aspect-[3/4] bg-[#1A1A1A] mb-4">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  data-testid={`thumbnail-${index}`}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-[#1A1A1A] ${selectedImage === index ? 'border-2 border-white' : 'border border-white/20'
                    }`}
                >
                  <img
                    src={image}
                    alt={`View ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 uppercase">
                {product.name}
              </h1>
              <p className="text-3xl text-white font-mono mb-4">
                ${product.price.toFixed(2)}
              </p>

              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.round(averageRating) ? 'fill-[#D00000] text-[#D00000]' : 'text-white/20'}
                      />
                    ))}
                  </div>
                  <span className="text-white/60 font-mono text-sm">
                    {averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>

            <p className="text-white/70 leading-relaxed">
              {product.description}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-mono text-sm uppercase mb-2">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      data-testid={`size-${size}`}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 font-mono text-sm uppercase transition-colors ${selectedSize === size
                        ? 'bg-white text-black'
                        : 'bg-transparent text-white border border-white/20 hover:border-white'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-mono text-sm uppercase mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-4 border border-white/20 w-fit">
                  <button
                    data-testid="decrease-quantity"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-white hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="px-4 text-white font-mono">{quantity}</span>
                  <button
                    data-testid="increase-quantity"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-white hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              data-testid="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock === 0 ? 'SOLD OUT' : 'ADD TO CART'}
            </button>

            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 text-white/60">
                <Truck size={20} />
                <span className="font-mono text-sm">FREE SHIPPING ON ORDERS OVER $100</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <Shield size={20} />
                <span className="font-mono text-sm">30-DAY RETURN POLICY</span>
              </div>
            </div>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-white mb-8 uppercase">
              Reviews ({reviews.length})
            </h2>

            <div className="space-y-6">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.review_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid={`review-${index}`}
                  className="border border-white/10 p-6"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'fill-[#D00000] text-[#D00000]' : 'text-white/20'}
                        />
                      ))}
                    </div>
                    <span className="text-white font-mono text-sm">{review.user_name}</span>
                  </div>
                  <p className="text-white/70">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
