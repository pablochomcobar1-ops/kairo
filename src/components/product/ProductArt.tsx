import { garmentKind, type GarmentKind } from "@/lib/images";
import { cn } from "@/lib/cn";
import { COLLECTIONS } from "@/lib/collections";
import { THEMES, themeForCollection } from "@/lib/theme";

/**
 * Stand-in "photo" until the AI shoot: the garment drawn as a technical flat in
 * its collection's colours. view 0 = the whole piece, view 1 = a close-up of
 * the cloth (what the second photo on hover will be).
 */

const PATHS: Record<GarmentKind, string> = {
  tee: "M110 70 L80 80 L40 120 L62 150 L88 132 L88 330 L212 330 L212 132 L238 150 L260 120 L220 80 L190 70 C182 92 118 92 110 70 Z",
  shirt:
    "M112 66 L80 78 L42 130 L44 270 L70 270 L80 150 L84 334 L216 334 L220 150 L230 270 L256 270 L258 130 L220 78 L188 66 L150 96 Z M112 66 L130 104 L150 96 L170 104 L188 66",
  knit: "M118 62 C118 50 182 50 182 62 L182 78 L222 88 L254 140 L258 300 L232 300 L222 160 L220 334 L80 334 L78 160 L68 300 L42 300 L46 140 L78 88 L118 78 Z",
  hoodie:
    "M108 76 C100 30 200 30 192 76 L226 88 L258 142 L262 300 L234 300 L224 168 L222 336 L78 336 L76 168 L66 300 L38 300 L42 142 L74 88 Z M118 80 C126 110 174 110 182 80 M128 250 L172 250 L180 290 L120 290 Z",
  jacket:
    "M110 62 L76 76 L40 136 L40 316 L70 316 L76 170 L78 350 L148 350 L148 112 L120 62 Z M190 62 L224 76 L260 136 L260 316 L230 316 L224 170 L222 350 L152 350 L152 112 L180 62 Z M120 62 L138 150 L148 112 M180 62 L162 150 L152 112",
  trouser:
    "M92 52 L208 52 L214 92 L232 352 L172 352 L154 140 L146 140 L128 352 L68 352 L86 92 Z M92 76 L208 76 M150 76 L150 140",
  tie: "M136 50 L164 50 L170 80 L158 92 L188 300 L150 350 L112 300 L142 92 L130 80 Z",
  gloves:
    "M70 340 L70 230 L52 170 C46 152 66 144 74 160 L86 196 L84 110 C84 92 106 92 106 110 L108 180 L110 96 C110 78 132 78 132 96 L132 182 L136 110 C136 92 158 92 158 112 L156 230 L150 340 Z M164 330 L170 230 L172 120 C172 102 194 102 194 120 L194 186 L198 100 C198 82 220 82 220 100 L220 190 L226 116 C226 98 248 100 246 118 L240 200 L254 166 C262 150 280 158 274 176 L248 250 L240 340 Z",
};

type Props = {
  name: string;
  collection: string;
  view?: 0 | 1;
  className?: string;
};

export function ProductArt({ name, collection, view = 0, className }: Props) {
  const theme = THEMES[themeForCollection(collection)];
  const number = COLLECTIONS.find((c) => c.slug === collection)?.number ?? "00";
  const kind = garmentKind(name);
  const light = collection === "old-money";
  const ink = theme.accent;
  const paper = light ? "#E9E2D3" : theme.background;
  const id = `art-${name.replace(/\W+/g, "-").toLowerCase()}-${view}`;

  return (
    <svg
      viewBox="0 0 300 400"
      role="img"
      aria-label={view === 0 ? `${name}, illustration` : `${name}, fabric detail illustration`}
      className={cn("block size-full", className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor={ink} stopOpacity={light ? 0.16 : 0.22} />
          <stop offset="100%" stopColor={paper} stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`${id}-weave`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={ink} strokeOpacity="0.18" strokeWidth="1.4" />
        </pattern>
      </defs>
      <rect width="300" height="400" fill={paper} />
      <rect width="300" height="400" fill={`url(#${id}-glow)`} />

      {view === 0 ? (
        <g>
          <path d={PATHS[kind]} fill={`url(#${id}-weave)`} />
          <path
            d={PATHS[kind]}
            fill="none"
            stroke={ink}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          {/* close-up: the cloth in folds, a seam and a stitched label */}
          <rect width="300" height="400" fill={`url(#${id}-weave)`} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M-20 ${70 + i * 70} C 80 ${40 + i * 70}, 200 ${110 + i * 70}, 320 ${60 + i * 70}`}
              fill="none"
              stroke={ink}
              strokeOpacity={0.25 + (i % 2) * 0.15}
              strokeWidth="1.2"
            />
          ))}
          <line
            x1="196"
            y1="0"
            x2="196"
            y2="400"
            stroke={ink}
            strokeOpacity="0.6"
            strokeDasharray="5 5"
          />
          <rect x="72" y="150" width="96" height="58" fill={paper} stroke={ink} strokeWidth="1.2" />
          <text
            x="120"
            y="176"
            textAnchor="middle"
            style={{ fontFamily: "var(--font-display)" }}
            fontSize="16"
            fontWeight="700"
            letterSpacing="4"
            fill={ink}
          >
            KAIRO
          </text>
          <text
            x="120"
            y="196"
            textAnchor="middle"
            style={{ fontFamily: "var(--font-mono)" }}
            fontSize="8"
            letterSpacing="1.5"
            fill={ink}
            opacity="0.8"
          >
            AHMEDABAD
          </text>
        </g>
      )}

      <text
        x="18"
        y="384"
        style={{ fontFamily: "var(--font-mono)" }}
        fontSize="10"
        letterSpacing="1.5"
        fill={ink}
        opacity="0.75"
      >
        {number} / {kind.toUpperCase()}
      </text>
      <text
        x="282"
        y="384"
        textAnchor="end"
        style={{ fontFamily: "var(--font-mono)" }}
        fontSize="9"
        letterSpacing="1"
        fill={ink}
        opacity="0.5"
      >
        CONCEPT
      </text>
    </svg>
  );
}
