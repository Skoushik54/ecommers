import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Tilt } from 'react-tilt';
import gsap from 'gsap';

const Hero = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 500], [1, 0.9]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const y = useTransform(scrollY, [0, 500], [0, 200]);

  useEffect(() => {
    const letters = document.querySelectorAll('.hero-letter');
    gsap.fromTo(
      letters,
      { opacity: 0, y: 150, rotateX: 90 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1.2,
        stagger: 0.08,
        ease: 'power4.out'
      }
    );
  }, []);

  const defaultTiltOptions = {
    reverse: false,  // reverse the tilt direction
    max: 15,     // max tilt rotation (degrees)
    perspective: 1000,   // Transform perspective, the lower the more extreme the tilt gets.
    scale: 1.02,   // 2 = 200%, 1.5 = 150%, etc..
    speed: 1000,   // Speed of the enter/exit transition
    transition: true,   // Set a transition on enter/exit.
    axis: null,   // What axis should be disabled. Can be X or Y.
    reset: true,   // If the tilt effect has to be reset on exit.
    easing: "cubic-bezier(.03,.98,.52,.99)",    // Easing on enter/exit.
  }

  return (
    <motion.section
      ref={heroRef}
      data-testid="hero-section"
      style={{ scale, opacity, y }}
      className="relative h-screen flex items-center justify-center overflow-hidden perspective-1000"
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1736284162276-d27cf9e9ec54?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) brightness(0.25) contrast(1.2)'
        }}
      />

      {/* Dynamic Noise Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none z-10 mix-blend-overlay"></div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/40 to-[#050505] z-10" />

      <div className="relative z-20 text-center px-6 w-full max-w-7xl mx-auto">
        <Tilt options={defaultTiltOptions}>
          <div className="overflow-hidden hover:scale-[1.01] transition-transform duration-700 cursor-default">
            <h1 className="text-[15vw] leading-[0.8] font-bold tracking-tighter text-white mb-6 mix-blend-exclusion">
              {'RARE'.split('').map((letter, i) => (
                <span key={i} className="hero-letter inline-block transform-style-3d text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">{letter}</span>
              ))}
            </h1>
          </div>
        </Tilt>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <p
            className="text-xl sm:text-2xl text-white/70 mb-12 font-mono uppercase tracking-[0.2em] max-w-xl"
            data-testid="hero-subtitle"
          >
            Rare is not for everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full">
            <button
              data-testid="explore-collection-btn"
              onClick={() => navigate('/products')}
              className="btn-primary group relative overflow-hidden"
              data-hover-target="true"
            >
              <span className="relative z-10">Explore Collection</span>
              <div className="absolute inset-0 bg-[#FF0000] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-0"></div>
            </button>
            <button
              data-testid="our-philosophy-btn"
              onClick={() => {
                const element = document.getElementById('founder-story');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-outline group"
              data-hover-target="true"
            >
              <span className="group-hover:tracking-widest transition-all duration-300">Our Philosophy</span>
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 2, duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Scroll</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent"></div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Hero;
