"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const CREATORS = [
  {
    name: "Hafeez",
    title: "The Brew Architect",
    bio: "Operations wizard, ex-Tim Hortons, precision-driven.",
  },
  {
    name: "Sayeed",
    title: "The Dairy Whisperer",
    bio: "Dairy expert from Masqati lineage, elevating flavor through premium ingredients.",
  },
] as const;

export default function CreatorsSection() {
  return (
    <section
      aria-labelledby="creators-heading"
      className="relative z-10 px-6 py-14 md:py-16 border-t border-white/5"
    >
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-48px" }}
          variants={fadeUp}
          custom={0}
        >
          <h2
            id="creators-heading"
            className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-cream-light"
          >
            The <span className="italic font-normal text-crema">Creators</span>
          </h2>
          <div className="w-16 h-px bg-crema/25 mx-auto mt-5 rounded-full" />
        </motion.div>

        <div className="mt-10 md:mt-12 space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-12 md:text-left">
          {CREATORS.map((person, index) => (
            <motion.article
              key={person.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              custom={0.12 + index * 0.1}
              className="space-y-2 md:px-2"
            >
              <h3 className="font-serif text-lg md:text-xl text-cream-light">
                {person.name}
                <span className="text-warm-beige/50 font-normal"> — </span>
                <span className="italic text-crema/90 font-normal text-base md:text-lg">
                  &ldquo;{person.title}&rdquo;
                </span>
              </h3>
              <p className="text-sm text-warm-beige/55 leading-relaxed max-w-xs mx-auto md:mx-0 md:max-w-none">
                {person.bio}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          custom={0.35}
          className="mt-12 md:mt-14 font-serif text-sm md:text-base italic text-warm-beige/50 leading-relaxed max-w-md mx-auto"
        >
          Together, they craft an experience — not just a coffee.
        </motion.p>
      </div>
    </section>
  );
}
