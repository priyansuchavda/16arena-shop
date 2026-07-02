import Image from "next/image";
import Link from "next/link";

const DEFAULT_AVATAR_URL =
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_2-min.jpg";

/** Circular avatar — white ring, dark border, profile photo. */
export function ProfileAvatar({ src = DEFAULT_AVATAR_URL }: { src?: string }) {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3d2814] p-[2.5px] ring-1 ring-white/95">
      <span className="relative h-full w-full overflow-hidden rounded-full">
        <Image src={src} alt="" fill className="object-cover" sizes="40px" priority />
      </span>
    </span>
  );
}

type ProfileChipProps = {
  name?: string;
  href?: string;
  avatarUrl?: string;
};

/** Brown pill badge — avatar left, name right. Matches SWAG top-bar profile chip. */
export function ProfileChip({
  name = "Shlok Patel",
  href = "/login",
  avatarUrl,
}: ProfileChipProps) {
  return (
    <Link
      href={href}
      className="shop-pill group inline-flex h-[42px] shrink-0 items-center border border-[#a67c52]/65 bg-[#6b4423] py-0 pl-0.5 pr-3.5 shadow-[inset_0_1px_0_rgba(255,200,120,0.08)] transition hover:brightness-110"
    >
      <ProfileAvatar src={avatarUrl} />
      <span className="ml-2 max-w-[8rem] truncate text-[13px] font-bold leading-none text-white">
        {name}
      </span>
    </Link>
  );
}
