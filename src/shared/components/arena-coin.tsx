import { CoinIcon } from "./icons";

/** Gold Arena Coin value: coin glyph + tabular number in brand gold. */
export function ArenaCoin({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#FFC24D]"
      style={{ fontSize: size }}
    >
      <CoinIcon size={size + 1} />
      {value.toLocaleString("en-IN")}
    </span>
  );
}
