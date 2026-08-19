import Link from "next/link";
import { EggMark } from "@/src/ui/egg-mark";

type Props = {
  href?: string;
  size?: 36 | 64;
  className?: string;
};

export function LogoLink({ href = "/", size = 36, className = "logo" }: Props) {
  const inner = (
    <>
      <EggMark size={size} />
      <span className="logo-word">what2eat.food</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className} aria-label="what2eat.food">
        {inner}
      </Link>
    );
  }
  return <span className={className}>{inner}</span>;
}
