import Link from 'next/link';

export default function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-[#fe4446] py-24">
      {/* Faint giant letters in background */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none select-none overflow-hidden px-4">
        <span className="text-[18rem] font-black text-white/[0.06] leading-none -translate-y-8">Y</span>
        <span className="text-[18rem] font-black text-white/[0.06] leading-none translate-y-8">H</span>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <p className="text-white/70 text-sm font-bold tracking-[0.4em] uppercase mb-4">Join the movement</p>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6">
          Have a Story<br />to Tell?
        </h2>
        <p className="text-white/80 text-lg md:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
          Contribute your article on Yadav history, culture, or heritage. We review every submission and publish the best.
        </p>
        <Link
          href="/contribute"
          className="inline-flex items-center gap-3 bg-white text-[#fe4446] font-black text-lg px-12 py-4 rounded-full hover:scale-105 transition-all duration-300"
        >
          Contribute Now
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
