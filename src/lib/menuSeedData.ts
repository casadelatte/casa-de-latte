/**
 * Casa De Latte catalog — used only by `npm run db:seed` (Supabase upsert).
 * Customer/admin UIs load menu from the database at runtime.
 */

export interface SeedCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  sortOrder: number;
}

export interface SeedItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  ingredients?: string[];
  isHotAvailable?: boolean;
  isColdAvailable?: boolean;
  requiresMilkCustomization?: boolean;
  sortOrder: number;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: "summer-specials",
    name: "Summer in a Cup",
    description: "Cold, effervescent, and fruity creations perfect for warm days.",
    iconName: "Sun",
    sortOrder: 0,
  },
  {
    id: "hot-brews",
    name: "Hot & Bold Brews",
    description: "Classic rich, deep, and aromatic specialty coffees brewed hot.",
    iconName: "Coffee",
    sortOrder: 1,
  },
  {
    id: "iced-espresso",
    name: "Iced & Espresso'd",
    description: "Chilled and bold espresso shots over ice with dynamic flavors.",
    iconName: "CupSoda",
    sortOrder: 2,
  },
  {
    id: "casa-classics",
    name: "Casa Signature Classics",
    description: "Artisanal specialty recipes crafted uniquely by our head baristas.",
    iconName: "Sparkles",
    sortOrder: 3,
  },
  {
    id: "matcha",
    name: "Oh So Matcha!",
    description: "Premium stone-ground Uji matcha whisked to perfection.",
    iconName: "Leaf",
    sortOrder: 4,
  },
  {
    id: "brewed-bold",
    name: "Brewed & Bold Collection",
    description: "Slow-steeped 18-hour cold brews with delicate natural notes.",
    iconName: "Clock",
    sortOrder: 5,
  },
  {
    id: "crushed-affairs",
    name: "Crushed Affairs",
    description: "Thick, blended milkshakes and decadent espresso frappes.",
    iconName: "Flame",
    sortOrder: 6,
  },
  {
    id: "steeped-soothing",
    name: "Steeped & Soothing",
    description: "Calming premium loose-leaf green and herbal teas.",
    iconName: "Flower2",
    sortOrder: 7,
  },
  {
    id: "sandwich-bagel",
    name: "Sandwich & Bagel Bar",
    description: "Freshly toasted artisanal breads, croissants, and savory paninis.",
    iconName: "Cookie",
    sortOrder: 8,
  },
  {
    id: "baked-delights",
    name: "Baked Delights",
    description: "Flaky, buttery French pastries baked fresh in-house every morning.",
    iconName: "Croissant",
    sortOrder: 9,
  },
  {
    id: "desserts",
    name: "Dessert Bar",
    description: "Decadent, rich, sweet treats to perfectly pair with your coffee.",
    iconName: "Cake",
    sortOrder: 10,
  },
];

export const SEED_ITEMS: SeedItem[] = [
  // Summer in a Cup
  {
    id: "rose-mary-coffee",
    categoryId: "summer-specials",
    name: "Rose Mary Coffee",
    price: 229,
    description: "Espresso with sparkling water, rosemary, and botanical syrup.",
    isColdAvailable: true,
    sortOrder: 0,
  },
  {
    id: "iced-chocolate",
    categoryId: "summer-specials",
    name: "Iced Chocolate",
    price: 249,
    description: "Ghana dark chocolate in chilled milk over ice.",
    isColdAvailable: true,
    requiresMilkCustomization: true,
    sortOrder: 1,
  },
  {
    id: "mango-affogato",
    categoryId: "summer-specials",
    name: "Mango Affogato",
    price: 279,
    description: "Vanilla gelato with hot espresso and Alphonso mango compote.",
    isColdAvailable: true,
    sortOrder: 2,
  },

  // Hot & Bold Brews
  { id: "latte", categoryId: "hot-brews", name: "Latte", price: 169, isHotAvailable: true, requiresMilkCustomization: true, sortOrder: 0 },
  { id: "cappuccino", categoryId: "hot-brews", name: "Cappuccino", price: 169, isHotAvailable: true, requiresMilkCustomization: true, sortOrder: 1 },
  { id: "cafe-mocha", categoryId: "hot-brews", name: "Cafe Mocha", price: 239, isHotAvailable: true, requiresMilkCustomization: true, sortOrder: 2 },
  { id: "hot-caramel-macchiato", categoryId: "hot-brews", name: "Hot Caramel Macchiato", price: 269, isHotAvailable: true, requiresMilkCustomization: true, sortOrder: 3 },
  { id: "ratnagiri-americano", categoryId: "hot-brews", name: "Ratnagiri Naturals Americano", price: 199, isHotAvailable: true, sortOrder: 4 },

  // Iced & Espresso'd
  { id: "iced-latte", categoryId: "iced-espresso", name: "Iced Latte", price: 169, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 0 },
  { id: "coconut-americano", categoryId: "iced-espresso", name: "Coconut Americano", price: 239, isColdAvailable: true, sortOrder: 1 },
  { id: "iced-mocha", categoryId: "iced-espresso", name: "Iced Mocha", price: 239, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 2 },
  { id: "iced-cranberry-coffee", categoryId: "iced-espresso", name: "Iced Cranberry Coffee", price: 249, isColdAvailable: true, sortOrder: 3 },
  { id: "iced-valencia-coffee", categoryId: "iced-espresso", name: "Iced Valencia Coffee", price: 249, isColdAvailable: true, sortOrder: 4 },
  { id: "iced-blueberry-latte", categoryId: "iced-espresso", name: "Iced Blueberry Latte", price: 249, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 5 },
  { id: "iced-caramel-macchiato", categoryId: "iced-espresso", name: "Iced Caramel Macchiato", price: 269, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 6 },

  // Casa Signature Classics
  { id: "hot-chocolate", categoryId: "casa-classics", name: "Hot Chocolate", price: 300, isHotAvailable: true, requiresMilkCustomization: true, sortOrder: 0 },
  { id: "pistachio-latte", categoryId: "casa-classics", name: "Pistachio Latte (Hot & Cold)", price: 279, isHotAvailable: true, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 1 },
  { id: "spanish-latte", categoryId: "casa-classics", name: "Spanish Latte (Hot & Cold)", price: 259, isHotAvailable: true, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 2 },
  { id: "saffron-latte", categoryId: "casa-classics", name: "Saffron Latte (Hot & Cold)", price: 249, isHotAvailable: true, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 3 },
  { id: "biscoff-latte", categoryId: "casa-classics", name: "Biscoff Latte (Hot & Cold)", price: 249, isHotAvailable: true, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 4 },
  { id: "iced-french-vanilla", categoryId: "casa-classics", name: "Iced French Vanilla Latte", price: 249, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 5 },

  // Steeped & Soothing
  { id: "exotic-fruit-tea", categoryId: "steeped-soothing", name: "Exotic Fruit Green Tea", price: 150, isHotAvailable: true, sortOrder: 0 },
  { id: "kashmiri-kahwa", categoryId: "steeped-soothing", name: "Kashmiri Kahwa Tea", price: 150, isHotAvailable: true, sortOrder: 1 },
  { id: "chamomile-tea", categoryId: "steeped-soothing", name: "Chamomile Tea", price: 150, isHotAvailable: true, sortOrder: 2 },
  { id: "english-breakfast", categoryId: "steeped-soothing", name: "English Breakfast Tea", price: 150, isHotAvailable: true, sortOrder: 3 },
  { id: "iced-mango-tea", categoryId: "steeped-soothing", name: "Iced Mango Tea", price: 219, isColdAvailable: true, sortOrder: 4 },
  { id: "iced-passion-tea", categoryId: "steeped-soothing", name: "Iced Passion Fruit Tea", price: 219, isColdAvailable: true, sortOrder: 5 },

  // Brewed & Bold
  { id: "classic-cold-brew", categoryId: "brewed-bold", name: "Classic Cold Brew (Home Blend)", price: 229, isColdAvailable: true, sortOrder: 0 },
  { id: "raspberry-cold-brew", categoryId: "brewed-bold", name: "Raspberry Infused Cold Brew", price: 249, isColdAvailable: true, sortOrder: 1 },
  { id: "passion-fruit-cold-brew", categoryId: "brewed-bold", name: "Passion Fruit Infused Cold Brew", price: 249, isColdAvailable: true, sortOrder: 2 },

  // Crushed Affairs
  { id: "passion-fruit-frappe", categoryId: "crushed-affairs", name: "Passion Fruit Frappe", price: 269, isColdAvailable: true, sortOrder: 0 },
  { id: "blueberry-frappe", categoryId: "crushed-affairs", name: "Blueberry Frappe", price: 269, isColdAvailable: true, sortOrder: 1 },
  { id: "espresso-vanilla-frappe", categoryId: "crushed-affairs", name: "Espresso & Vanilla Frappe", price: 289, isColdAvailable: true, sortOrder: 2 },
  { id: "java-iceberg", categoryId: "crushed-affairs", name: "Java Iceberg", price: 300, isColdAvailable: true, sortOrder: 3 },

  // Oh So Matcha!
  { id: "matcha-latte", categoryId: "matcha", name: "Matcha Latte (Hot/Cold)", price: 239, isHotAvailable: true, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 0 },
  { id: "vietnamese-matcha", categoryId: "matcha", name: "Vietnamese Matcha (Hot/Cold)", price: 259, isHotAvailable: true, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 1 },
  { id: "iced-mango-matcha", categoryId: "matcha", name: "Iced Mango Matcha Latte", price: 269, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 2 },
  { id: "iced-blueberry-matcha", categoryId: "matcha", name: "Iced Blueberry Matcha Latte", price: 269, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 3 },
  { id: "iced-strawberry-matcha", categoryId: "matcha", name: "Iced Strawberry Matcha Latte", price: 259, isColdAvailable: true, requiresMilkCustomization: true, sortOrder: 4 },
  { id: "iced-valencia-matcha", categoryId: "matcha", name: "Iced Valencia Matcha", price: 269, isColdAvailable: true, sortOrder: 5 },

  // Sandwich & Bagel Bar
  { id: "cream-cheese-bagel", categoryId: "sandwich-bagel", name: "Cream Cheese Bagel", price: 209, sortOrder: 0 },
  { id: "bagel-chicken-cheese", categoryId: "sandwich-bagel", name: "Bagel Chicken & Cheese", price: 239, sortOrder: 1 },
  { id: "bagel-paneer-cheese", categoryId: "sandwich-bagel", name: "Bagel Paneer & Cheese", price: 239, sortOrder: 2 },
  { id: "croissant-sandwich", categoryId: "sandwich-bagel", name: "Croissant Sandwich (Paneer/Chicken)", price: 249, sortOrder: 3 },
  { id: "ciabatta-sandwich", categoryId: "sandwich-bagel", name: "Ciabatta Sandwich (Paneer/Chicken)", price: 269, sortOrder: 4 },
  { id: "pesto-chicken-bagel", categoryId: "sandwich-bagel", name: "Pesto Chicken Bagel", price: 289, sortOrder: 5 },
  { id: "triple-cheese-panini", categoryId: "sandwich-bagel", name: "Triple Cheese & Chicken Panini", price: 300, sortOrder: 6 },
  { id: "avocado-toast", categoryId: "sandwich-bagel", name: "Avocado Toast", price: 300, sortOrder: 7 },
  { id: "herbs-focaccia-chicken", categoryId: "sandwich-bagel", name: "Herbs Focaccia Chicken Sandwich", price: 300, sortOrder: 8 },

  // Baked Delights
  { id: "mini-croissants", categoryId: "baked-delights", name: "Mini Croissants Pack", price: 100, sortOrder: 0 },
  { id: "butter-croissant", categoryId: "baked-delights", name: "Butter Croissant", price: 150, sortOrder: 1 },
  { id: "pain-au-chocolat", categoryId: "baked-delights", name: "Pain au Chocolat", price: 229, sortOrder: 2 },
  { id: "almond-croissant", categoryId: "baked-delights", name: "Almond Flaky Croissant", price: 229, sortOrder: 3 },
  { id: "korean-garlic-bun", categoryId: "baked-delights", name: "Korean Garlic Bun", price: 250, sortOrder: 4 },

  // Dessert Bar
  { id: "brownie", categoryId: "desserts", name: "Brownie", price: 150, sortOrder: 0 },
  { id: "blueberry-cheesecake", categoryId: "desserts", name: "Blueberry Cheesecake Slice", price: 275, sortOrder: 1 },
  { id: "pistachio-kunafa-cake", categoryId: "desserts", name: "Pistachio Kunafa Cake", price: 300, sortOrder: 2 },
  { id: "matilda-cake", categoryId: "desserts", name: "Matilda Chocolate Cake", price: 360, sortOrder: 3 },
];
