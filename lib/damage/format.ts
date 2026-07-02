export const formatFull = (value: number) =>
  Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);

export const formatCompact = (value: number) =>
  Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
