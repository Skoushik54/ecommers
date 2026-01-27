import React from 'react';
import { motion } from 'framer-motion';

const FounderStory = () => {
  return (
    <section 
      id="founder-story"
      data-testid="founder-story-section"
      className="py-32 px-6 lg:px-12 bg-[#050505]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1738247999939-de1b5d41626e?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="RARE Founder"
                className="w-full h-full object-cover grayscale"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="h-1 w-24 bg-[#D00000]" />
            
            <h2 className="text-5xl lg:text-6xl font-bold text-white">
              WHY RARE EXISTS
            </h2>
            
            <div className="space-y-4 text-white/70 text-lg leading-relaxed">
              <p>
                We started RARE because we were tired of seeing the same mass-produced clothing everywhere. Everyone wearing the same things, following the same trends, playing it safe.
              </p>
              <p>
                RARE is for people who want to express themselves. Who aren't afraid to stand out. Who value quality over quantity and uniqueness over conformity.
              </p>
              <p>
                Every piece we create is designed with intention. Limited quantities. Premium materials. Bold designs. We're not trying to appeal to everyone – we're creating for the few who get it.
              </p>
              <p className="text-white font-bold">
                Are you rare enough?
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FounderStory;
