import React from "react";

export default function KhatamStar({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`khatam-star ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
