export default function SeqwaterLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="34"
        height="34"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="seqGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00AEEF" />
            <stop offset="100%" stopColor="#0076BE" />
          </linearGradient>
          <linearGradient id="seqGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5FA777" />
            <stop offset="100%" stopColor="#2E7D59" />
          </linearGradient>
        </defs>
        <path
          d="M32 6 C 20 24, 13 35, 13 43 a19 19 0 0 0 38 0 c 0 -8 -7 -19 -19 -37 z"
          fill="url(#seqGrad)"
        />
        <path
          d="M40 36 q -3 6 -9 5 q -4 -1 -6 -5 q 2 6 8 7 q 6 1 11 -3 z"
          fill="url(#seqGrad2)"
          opacity="0.9"
        />
      </svg>
      {!compact ? (
        <div className="leading-tight">
          <div className="text-[18px] font-semibold tracking-tight text-deepNavy">
            seq<span className="font-bold">water</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-ink-muted">
            Water for Life
          </div>
        </div>
      ) : null}
    </div>
  );
}
