import type { CSSProperties, ReactNode } from "react";

function chamfer(cut: number): string {
  return `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`;
}

/**
 * Chamfered HUD panel with a crisp 1px border.
 * Two stacked clipped layers (border fill + inset surface fill) so the
 * hairline follows the diagonal cuts — box-shadow can't do that.
 */
export function HudPanel({
  children,
  className = "",
  innerClassName = "",
  cut = 13,
  border = "var(--line)",
  fill = "var(--carbon)",
  style,
  innerStyle,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  cut?: number;
  border?: string;
  fill?: string;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
}) {
  const clip = chamfer(cut);
  return (
    <div className={className} style={{ clipPath: clip, background: border, padding: 1, ...style }}>
      <div
        className={`h-full w-full ${innerClassName}`}
        style={{ clipPath: chamfer(cut - 1), background: fill, ...innerStyle }}
      >
        {children}
      </div>
    </div>
  );
}

/** Four L-shaped tactical brackets pinned to a panel's corners. */
export function CornerTicks({ color = "var(--line-2)", size = 11 }: { color?: string; size?: number }) {
  const base: CSSProperties = { position: "absolute", width: size, height: size, pointerEvents: "none" };
  const t = `2px solid ${color}`;
  return (
    <>
      <span style={{ ...base, top: 8, left: 8, borderTop: t, borderLeft: t }} />
      <span style={{ ...base, top: 8, right: 8, borderTop: t, borderRight: t }} />
      <span style={{ ...base, bottom: 8, left: 8, borderBottom: t, borderLeft: t }} />
      <span style={{ ...base, bottom: 8, right: 8, borderBottom: t, borderRight: t }} />
    </>
  );
}
