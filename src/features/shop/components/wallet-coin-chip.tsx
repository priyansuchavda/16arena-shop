import Image from "next/image";
import Link from "next/link";
import coinImg from "@/assets/png/coin.png";

export function WalletCoinChip({ balance }: { balance: number }) {
  return (
    <Link
      href="/transactions"
      className="shop-pill relative inline-flex h-9 shrink-0 items-center gap-1.5 border border-white/10 bg-white/[0.03] py-1 pl-1 pr-2.5 cursor-pointer transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-95 lg:h-[42px] lg:gap-2 lg:pr-4"
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center lg:h-8 lg:w-8">
        <Image
          src={coinImg}
          alt=""
          width={28}
          height={28}
          className="relative h-5 w-5 object-contain lg:h-[28px] lg:w-[28px]"
        />
      </span>
      <span className="font-data text-[12px] font-semibold leading-none tabular-nums text-white lg:text-[14px]">
        {balance.toLocaleString("en-IN")}
      </span>
    </Link>
  );
}

