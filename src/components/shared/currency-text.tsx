import React from "react";
import { formatIDR } from "@/lib/utils";

interface CurrencyTextProps {
  value: number;
  className?: string;
  prefix?: string;
}

export function CurrencyText({ value, className, prefix }: CurrencyTextProps) {
  return (
    <span className={className}>
      {prefix}
      {formatIDR(value)}
    </span>
  );
}
