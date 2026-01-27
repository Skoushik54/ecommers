import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollStory = () => {
  const containerRef = useRef(null);

  const stories = [
    {
      title: "LIMITED DROPS",
      description: "We don't mass produce. Each piece is crafted in limited quantities. When it's gone, it's gone forever.",
      image: "https://images.unsplash.com/photo-1550973886-df96a40a2be2?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "PREMIUM MATERIALS",
      description: "Heavyweight cotton, technical fabrics, Japanese denim. We source the best materials from around the world.",
      image: "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "DESIGNED TO STAND OUT",
      description: "Bold silhouettes, experimental cuts, statement details. Clothing for those who refuse to blend in.",
      image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  return (
    <section
      ref={containerRef}
      data-testid="scroll-story-section"
      className="py-32 px-6 lg:px-12 bg-[#050505] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto space-y-48">
        {stories.map((story, index) => (
          <StoryItem key={index} story={story} index={index} />
        ))}
      </div>
    </section>
  );
};

const StoryItem = ({ story, index }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-24`}
    >
      <div className="flex-1 space-y-8">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="h-1 w-24 bg-[#D00000] origin-left"
        />
        <h2 className="text-5xl lg:text-7xl text-white font-bold leading-none tracking-tighter">
          {story.title}
        </h2>
        <p className="text-xl text-white/60 leading-relaxed font-mono max-w-lg">
          {story.description}
        </p>
      </div>

      <div className="flex-1 relative aspect-[4/5] w-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
        <motion.div style={{ y }} className="absolute inset-0 -top-[20%] -bottom-[20%]">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Overlay for texture */}
        <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay"></div>
      </div>
    </motion.div>
  );
}

export default ScrollStory;
