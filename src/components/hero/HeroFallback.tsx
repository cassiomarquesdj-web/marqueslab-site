/** Versão estática do símbolo, usada sem WebGL ou enquanto a cena 3D carrega. */
export function HeroFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
      <div className="absolute size-[46vmin] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.18),transparent_65%)]" />
      <svg
        viewBox="-1 -1 10 10"
        className="relative w-[38vmin] max-w-md drop-shadow-[0_0_30px_rgba(255,106,0,0.25)]"
      >
        <defs>
          <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f2f2f4" />
            <stop offset="0.5" stopColor="#8d8d92" />
            <stop offset="1" stopColor="#d7d7da" />
          </linearGradient>
        </defs>
        <path
          fill="url(#chrome)"
          d="M0 8 V0 H3.1 L4 1.4 L4.9 0 H6.6 L8 1.4 V8 H6 V3.4 L4 6.2 L2 3.4 V8 Z"
        />
        <path fill="#ff6a00" d="M2.7 8 H5.3 L5 7.45 H3 Z" />
      </svg>
    </div>
  );
}
