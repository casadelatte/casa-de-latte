export type MenuAnimationFamily = "drinks" | "sandwich" | "baked" | "dessert";

const SANDWICH = new Set(["sandwich-bagel"]);
const BAKED = new Set(["baked-delights"]);
const DESSERT = new Set(["desserts"]);

export function getMenuAnimationFamily(categoryId: string): MenuAnimationFamily {
  if (SANDWICH.has(categoryId)) return "sandwich";
  if (BAKED.has(categoryId)) return "baked";
  if (DESSERT.has(categoryId)) return "dessert";
  return "drinks";
}

export function getDrinkAnimationMode(
  isHotAvailable?: boolean,
  isColdAvailable?: boolean,
  temp?: string
): "hot" | "cold" {
  if (isHotAvailable && isColdAvailable) {
    return temp?.toLowerCase().includes("ice") ? "cold" : "hot";
  }
  if (isColdAvailable && !isHotAvailable) return "cold";
  return "hot";
}

export function getLiquidColor(itemName: string, categoryId: string): string {
  const name = itemName.toLowerCase();
  if (name.includes("matcha") || categoryId === "matcha") return "#5d7c50";
  if (name.includes("tea") && !name.includes("latte")) return "#a45d35";
  if (name.includes("chocolate") || name.includes("mocha") || name.includes("fudge")) return "#2b1b17";
  if (name.includes("cranberry") || name.includes("blueberry")) return "#6b3a5c";
  if (name.includes("mango") || name.includes("passion")) return "#d97706";
  return "#3e2723";
}

export const LOGO_PATH = "/casa-logo.png";
