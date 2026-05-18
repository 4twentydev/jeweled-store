"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-[calc(100svh-4rem)] md:min-h-[92vh] flex flex-col overflow-hidden">
            {/* Hero background image */}
            <Image
                src="/hero.png"
                alt=""
                fill
                priority
                className="object-cover object-[70%_center] sm:object-[66%_center] md:object-center"
                sizes="100vw"
            />
            {/* Dark overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/80 md:bg-black/55" />

            {/* Content — bottom-left anchored */}
            <div className="relative z-10 mt-auto max-w-[1400px] mx-auto w-full px-6 lg:px-12 pt-28 pb-14 sm:pb-20 md:pb-36">
                <div className="max-w-[560px]">
                    <motion.p
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-7"
                    >
                        Hand-Applied · Ruthlessly Refined
                    </motion.p>

                    <motion.h1
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.95,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.1,
                        }}
                        className="font-light tracking-tight text-foreground leading-[1.04] mb-10 text-[3rem] sm:text-[4.25rem] md:text-[5.5rem] md:mb-12"
                    >
                        Catch
                        <br className="hidden sm:block" /> the Light.
                    </motion.h1>

                    <motion.div
                        initial={false}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.32,
                        }}
                    >
                        <Link
                            href="/products"
                            className="group inline-flex items-center gap-3 px-7 py-3.5 text-[11px] tracking-[0.28em] uppercase bg-foreground text-background hover:opacity-80 transition-opacity duration-300"
                        >
                            Shop the Collection
                            <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-1.5" />
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>
    );
}
