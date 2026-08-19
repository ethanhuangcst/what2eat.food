type Props = {
  size?: 36 | 64 | 72;
  className?: string;
};

export function EggMark({ size = 36, className }: Props) {
  return (
    <span className={className ?? "mark-host"}>
      <svg className="mark-steam" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M24 20q-4-10 2-20" />
        <path d="M33 17q4-11-1-22" />
        <path d="M42 20q4-10-2-20" />
      </svg>
      <img className="mark" src="/food-logo.png" alt="" width={size} height={size} />
    </span>
  );
}
