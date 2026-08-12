/**
 * Decorative backdrop for the authentication screens.
 *
 * Layers, back to front:
 *   1. a deep radial wash that anchors the page in near-black
 *   2. three slow-drifting aurora blobs (the colour)
 *   3. a masked engineering grid (the "product, not brochure" signal)
 *   4. a neural graph whose edges carry travelling signals (the "AI" signal)
 *   5. film grain + vignette so the gradients don't band on wide displays
 *
 * Every animation sits behind Tailwind's `motion-safe:` variant, so the whole
 * thing renders as a still image for anyone who asked for reduced motion.
 * Purely presentational — `aria-hidden` and non-interactive.
 */

/** Graph vertices, in the 1200x800 viewBox. */
const NODES: ReadonlyArray<{ x: number; y: number }> = [
  { x: 120, y: 170 },
  { x: 296, y: 96 },
  { x: 232, y: 330 },
  { x: 430, y: 236 },
  { x: 96, y: 486 },
  { x: 318, y: 566 },
  { x: 486, y: 424 },
  { x: 620, y: 690 },
  { x: 742, y: 128 },
  { x: 906, y: 262 },
  { x: 1084, y: 156 },
  { x: 820, y: 512 },
  { x: 1012, y: 616 },
  { x: 1136, y: 404 },
];

/** Vertex pairs to connect. Two loose clusters with a few bridging edges. */
const EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [4, 5], [3, 6], [5, 6], [5, 7], [6, 7],
  [8, 9], [9, 10], [9, 13], [10, 13], [9, 11], [11, 12], [12, 13], [7, 11], [8, 3],
];

export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-slate-950"
    >
      {/* 1. Base wash — indigo bleeding down into near-black */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_-10%,#221c52_0%,#0d1329_45%,#020617_100%)]" />

      {/* 2. Aurora field */}
      <div className="absolute inset-0 mix-blend-screen">
        <div className="absolute -left-40 -top-48 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.55)_0%,rgba(99,102,241,0)_65%)] blur-3xl motion-safe:animate-aurora" />
        <div className="absolute -bottom-56 -right-32 h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.38)_0%,rgba(34,211,238,0)_65%)] blur-3xl motion-safe:animate-aurora-slow" />
        <div
          className="absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.32)_0%,rgba(217,70,239,0)_70%)] blur-3xl motion-safe:animate-aurora"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      {/* 3. Engineering grid, faded out at the edges */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[length:64px_64px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black_10%,transparent_80%)]" />

      {/* 4. Neural graph — masked away from the centre so the card stays legible */}
      <svg
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_58%_52%_at_50%_50%,transparent_15%,black_72%)]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="auth-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>

        {/* Static wiring */}
        <g stroke="url(#auth-edge)" strokeWidth="1" opacity="0.22">
          {EDGES.map(([from, to]) => (
            <line
              key={`w-${from}-${to}`}
              x1={NODES[from].x}
              y1={NODES[from].y}
              x2={NODES[to].x}
              y2={NODES[to].y}
            />
          ))}
        </g>

        {/* Signals travelling along the wiring */}
        <g
          stroke="url(#auth-edge)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="5 11"
          opacity="0.75"
        >
          {EDGES.map(([from, to], i) => (
            <line
              key={`s-${from}-${to}`}
              x1={NODES[from].x}
              y1={NODES[from].y}
              x2={NODES[to].x}
              y2={NODES[to].y}
              className="motion-safe:animate-dash-flow"
              style={{ animationDelay: `${(i % 7) * -0.45}s` }}
            />
          ))}
        </g>

        {/* Vertices: a soft halo behind a bright core */}
        {NODES.map((node, i) => (
          <g key={`n-${i}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r="9"
              fill="#818cf8"
              opacity="0.18"
              className="svg-node motion-safe:animate-pulse-node"
              style={{ animationDelay: `${(i % 5) * -0.8}s` }}
            />
            <circle cx={node.x} cy={node.y} r="2.5" fill="#e0e7ff" opacity="0.65" />
          </g>
        ))}
      </svg>

      {/* 5a. Film grain — keeps the wide gradients from banding */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.13] mix-blend-overlay">
        <filter id="auth-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#auth-grain)" />
      </svg>

      {/* 5b. Vignette — pulls the eye to the centre of the screen */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(2,6,23,0.75)_100%)]" />
    </div>
  );
}
