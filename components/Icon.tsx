export function Icon({
  name,
  className = "",
}: {
  name: "arrow" | "chevron";
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <path d={name === "arrow" ? "M4 12h15M13 5l7 7-7 7" : "m6 9 6 6 6-6"} />
    </svg>
  );
}
