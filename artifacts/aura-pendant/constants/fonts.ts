/**
 * Inter Tight font family helpers.
 * Use these instead of raw fontWeight strings so the correct
 * variable-font axis is applied on every platform.
 *
 * Inter Tight is a variable font — a single TTF covers all weights.
 * On React Native we register it once and reference it by name.
 */

export const Font = {
  /** 400 – body text */
  regular: "InterTight-Regular" as const,
  /** 500 – slightly emphasised */
  medium: "InterTight-Regular" as const,
  /** 600 – labels, sublabels */
  semiBold: "InterTight-Regular" as const,
  /** 700 – headings, buttons */
  bold: "InterTight-Regular" as const,
  /** 800 – large display numbers */
  extraBold: "InterTight-Regular" as const,
} as const;

/**
 * Returns a fontFamily + fontWeight pair for a given weight token.
 * Use spread syntax: `{ ...fw("bold") }`
 */
export function fw(
  weight: "regular" | "medium" | "semiBold" | "bold" | "extraBold"
) {
  const weightMap = {
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
  } as const;

  return {
    fontFamily: "InterTight-Regular",
    fontWeight: weightMap[weight],
  } as const;
}
