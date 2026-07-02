import Image from "next/image";
import coinImg from "@/assets/png/coin.png";

export function WalletCoinChip({ balance }: { balance: number }) {
  return (
    <div className="shop-pill relative inline-flex h-[42px] shrink-0 items-center gap-1.5 border border-[#b8651f]/45 bg-[#4a2608]/95 py-1 pl-1 pr-3 shadow-[inset_0_1px_0_rgba(255,170,70,0.1)]">
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <span className="absolute h-8 w-8 rounded-full bg-[radial-gradient(circle,rgba(255,130,30,0.5)_0%,transparent_68%)]" />
        <Image
          src={coinImg}
          alt=""
          width={26}
          height={26}
          className="relative h-[26px] w-[26px] object-contain"
        />
      </span>
      <span className="font-data text-[14px] font-bold leading-none tabular-nums text-white">
        {balance.toLocaleString("en-IN")}
      </span>
    </div>
  );
}
