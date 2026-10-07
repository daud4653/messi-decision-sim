import { useId } from "react";
import type { PitchScene } from "./types";
export function Pitch({ scene }: { scene: PitchScene }) {
  const marker = useId().replaceAll(":", "");
  return (
    <svg
      className="pitch"
      viewBox="-7 -9 134 98"
      role="img"
      aria-label="Tactical football pitch. Messi attacks from left to right. Only recorded positions are shown."
    >
      <defs>
        {["actual", "ai", "human", "previous"].map((k) => (
          <marker
            key={k}
            id={`${marker}-${k}`}
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto-start-reverse"
          >
            <path
              d="M0 0 L5 2.5 L0 5"
              fill={
                k === "actual"
                  ? "#ccf36b"
                  : k === "ai"
                    ? "#82c9e8"
                    : k === "human"
                      ? "#f5eee1"
                      : "#789589"
              }
            />
          </marker>
        ))}
      </defs>
      <rect x="-7" y="-9" width="134" height="98" fill="#163f31" />
      {[0, 2, 4].map((i) => (
        <rect key={i} x={i * 20} y="0" width="20" height="80" fill="#1b4738" />
      ))}
      <g fill="none" stroke="#7a9c89" strokeWidth=".35">
        <rect width="120" height="80" />
        <path d="M60 0V80" />
        <circle cx="60" cy="40" r="9.15" />
        <rect x="0" y="18" width="18" height="44" />
        <rect x="102" y="18" width="18" height="44" />
        <rect x="0" y="30" width="6" height="20" />
        <rect x="114" y="30" width="6" height="20" />
        <path d="M0 36H-2V44H0 M120 36H122V44H120 M18 32 Q23 40 18 48 M102 32 Q97 40 102 48" />
        <circle cx="12" cy="40" r=".5" fill="#7a9c89" />
        <circle cx="108" cy="40" r=".5" fill="#7a9c89" />
        <circle cx="60" cy="40" r=".5" fill="#7a9c89" />
      </g>
      <text
        x="60"
        y="-3"
        textAnchor="middle"
        fill="#b1c2b4"
        fontSize="2"
        letterSpacing=".8"
      >
        ATTACKING DIRECTION →
      </text>
      {scene.paths.map((p, i) => (
        <path
          key={`${p.kind}-${i}`}
          className={p.kind === "actual" ? "actual-path" : ""}
          d={`M${p.from.x} ${p.from.y} L${p.to.x} ${p.to.y}`}
          fill="none"
          stroke={
            p.kind === "actual"
              ? "#ccf36b"
              : p.kind === "ai"
                ? "#82c9e8"
                : p.kind === "human"
                  ? "#f5eee1"
                  : "#789589"
          }
          strokeWidth={p.kind === "actual" ? 1 : 0.65}
          strokeDasharray={p.kind === "actual" ? undefined : "2 1.4"}
          markerEnd={`url(#${marker}-${p.kind})`}
        />
      ))}
      {scene.players.map((p) => (
        <g key={p.id} transform={`translate(${p.position.x},${p.position.y})`}>
          <circle
            r="5.7"
            fill="none"
            stroke="#ccf36b"
            strokeWidth=".4"
            strokeDasharray="1 1"
          />
          <circle r="3.6" fill="#ccf36b" stroke="#132a20" strokeWidth=".7" />
          <text
            y="1.1"
            textAnchor="middle"
            fontSize="3"
            fontWeight="900"
            fill="#172019"
          >
            10
          </text>
          <text
            y="-8"
            textAnchor="middle"
            fontSize="2.7"
            letterSpacing=".4"
            fill="#f5eee1"
          >
            MESSI
          </text>
        </g>
      ))}
      <circle
        cx={scene.ball.x + 3.4}
        cy={scene.ball.y + 2.6}
        r="1.15"
        fill="#f5eee1"
        stroke="#14231a"
        strokeWidth=".4"
      />
      <text x="0" y="86" fill="#b1c2b4" fontSize="2">
        120 × 80 · EVENT COORDINATES
      </text>
      <text x="120" y="86" textAnchor="end" fill="#b1c2b4" fontSize="2">
        POSITIONS BEYOND THE BALL ARE UNKNOWN
      </text>
    </svg>
  );
}
