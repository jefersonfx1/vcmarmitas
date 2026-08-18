export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "tradicional" | "fitness" | "vegetariana";
  calories?: number;
  weight?: string;
};

/** Sabores oficiais - Seleção da Chef (Tradicional) */
export const flavors: Product[] = [
  {
    id: "flavor-1",
    name: "Frango Grelhado ao Molho de Ervas",
    description:
      "Arroz branco, feijão carioca, frango grelhado com ervas e alho e cenoura com brócolis.",
    price: 24.9,
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop",
    category: "tradicional",
  },
  {
    id: "flavor-2",
    name: "Carne Acebolada",
    description:
      "Arroz branco, feijão carioca, carne acebolada ao molho da própria carne e abobrinha com cenoura.",
    price: 24.9,
    image:
      "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop",
    category: "tradicional",
  },
  {
    id: "flavor-3",
    name: "Filé de Sobrecoxa Assada",
    description:
      "Arroz com alho, feijão carioca, filé de sobrecoxa assado com ervas e páprica e batata-doce com cenoura.",
    price: 24.9,
    image:
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&h=400&fit=crop",
    category: "tradicional",
  },
  {
    id: "flavor-4",
    name: "Carne Moída Caseira",
    description:
      "Arroz branco, feijão preto, carne moída refogada com tomate e temperos e vagem com cenoura e milho.",
    price: 24.9,
    image:
      "https://images.unsplash.com/photo-1529042410759-befb1204bacc?w=600&h=400&fit=crop",
    category: "tradicional",
  },
  {
    id: "flavor-5",
    name: "Frango Cremoso",
    description:
      "Arroz branco, feijão carioca, frango desfiado cremoso com milho e ervas e brócolis com cenoura no vapor.",
    price: 24.9,
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
    category: "tradicional",
  },
  {
    id: "flavor-6",
    name: "Bife Acebolado com Molho",
    description:
      "Arroz branco, feijão preto, bife acebolado com molho caseiro e couve-flor com cenoura gratinada.",
    price: 24.9,
    image:
      "https://images.unsplash.com/photo-1604908177522-440442e4e3e4?w=600&h=400&fit=crop",
    category: "tradicional",
  },
];

/** @deprecated use flavors - mantido para compatibilidade */
export const products = flavors;

export type KitOption = {
  id: string;
  label: string;
  quantity: number;
  /** preço total do kit (ou unitário se unitPrice) */
  totalPrice: number;
  unitPrice: number;
  badge?: string;
};

export const kitOptions: KitOption[] = [
  {
    id: "kit-1",
    label: "Venda avulsa",
    quantity: 1,
    totalPrice: 24.9,
    unitPrice: 24.9,
  },
  {
    id: "kit-5",
    label: "Kit com 5 marmitas",
    quantity: 5,
    totalPrice: 119.9,
    unitPrice: 23.98,
    badge: "Economia",
  },
  {
    id: "kit-10",
    label: "Kit com 10 marmitas",
    quantity: 10,
    totalPrice: 229.9,
    unitPrice: 22.99,
    badge: "Popular",
  },
  {
    id: "kit-20",
    label: "Kit com 20 marmitas",
    quantity: 20,
    totalPrice: 378.0,
    unitPrice: 18.9,
    badge: "Melhor custo",
  },
  {
    id: "kit-50",
    label: "Kit com 50 ou mais",
    quantity: 50,
    totalPrice: 749.5, // 50 x 14.99
    unitPrice: 14.99,
    badge: "Atacado",
  },
];

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Preço unitário conforme quantidade total no pedido */
export function unitPriceForQuantity(qty: number): number {
  if (qty >= 50) return 14.99;
  if (qty >= 20) return 18.9;
  if (qty >= 10) return 22.99;
  if (qty >= 5) return 23.98;
  return 24.9;
}
