import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/png/Colored_Light.png";

function logoSize(height: number) {
  return {
    height,
    width: Math.round(logoImg.width * (height / logoImg.height)),
  };
}

export function ArenaLogo({
  className = "",
  height = 40,
  onClick,
}: {
  className?: string;
  /** Render height in px — width follows the asset aspect ratio. */
  height?: number;
  /** When set, logo acts as a button (e.g. reset shop to “All”) instead of linking home. */
  onClick?: () => void;
}) {
  const { width, height: h } = logoSize(height);

  const image = (
    <Image
      src={logoImg}
      alt="16 Arena"
      priority
      width={width}
      height={h}
      className="block max-w-none shrink-0 object-contain object-left"
      style={{ width, height: h }}
    />
  );

  const classNames = `inline-flex max-w-none shrink-0 origin-left items-center transition-transform duration-200 ease-out hover:scale-[1.09] ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classNames} aria-label="Show all">
        {image}
      </button>
    );
  }

  return (
    <Link href="/" className={classNames}>
      {image}
    </Link>
  );
}
