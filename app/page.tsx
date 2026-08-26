import Hero from "@/components/Hero";
import BentoSection from "@/components/BentoSection";
import GsapTimeline from "@/components/GsapTimeline";
import CardFan from "@/components/CardFan";
import ArticleCarousel from "@/components/ArticleCarousel";
import CircleScroll from "@/components/CircleScroll";
import CtaBanner from "@/components/CtaBanner";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero — YADAV letter entrance */}
      <Hero />

      {/* 2. Bento — Featured articles with blur-reveal */}
      <BentoSection />

      {/* 3. Timeline — GSAP scroll-animated */}
      <GsapTimeline />

      {/* 4. Card Fan — Interactive hand of cards */}
      <CardFan />

      {/* 5. Carousel — Horizontal swipe articles */}
      <ArticleCarousel />

      {/* 5. Circle Scroll — Orbital article layout */}
      <CircleScroll />

      {/* 6. CTA Banner */}
      <CtaBanner />
    </div>
  );
}
