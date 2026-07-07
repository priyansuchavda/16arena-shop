import Image from "next/image";
import coinImg from "@/assets/png/coin.png";

export function WalletCoinChip({ balance }: { balance: number }) {
  return (
    <div className="shop-pill relative inline-flex h-[42px] shrink-0 items-center gap-2 border border-white/10 bg-white/[0.03] py-1 pl-1 pr-4">
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <Image
          src={coinImg}
          alt=""
          width={28}
          height={28}
          className="relative h-[28px] w-[28px] object-contain"
        />
      </span>
      <span className="font-data text-[14px] font-bold leading-none tabular-nums text-white">
        {balance.toLocaleString("en-IN")}
      </span>
    </div>
  );
}
