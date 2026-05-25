export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  ingredients: string[];
  category: string;
  isHotAvailable?: boolean;
  isColdAvailable?: boolean;
  requiresMilkCustomization?: boolean;
  requiresRoastProfile?: boolean;
  isAvailable?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
}
