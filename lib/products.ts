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

export const products: Product[] = [
  {
    id: "1",
    name: "Frango Grelhado com Legumes",
    description: "Peito de frango grelhado, arroz integral, brócolis e cenoura.",
    price: 22.9,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
    category: "fitness",
    calories: 380,
    weight: "400g",
  },
  {
    id: "2",
    name: "Strogonoff de Frango",
    description: "Strogonoff cremoso de frango com arroz e batata palha.",
    price: 24.9,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop",
    category: "tradicional",
    calories: 520,
    weight: "450g",
  },
  {
    id: "3",
    name: "Feijoada Light",
    description: "Feijoada com menos gordura, acompanhada de arroz e farofa.",
    price: 26.9,
    image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&h=400&fit=crop",
    category: "tradicional",
    calories: 480,
    weight: "450g",
  },
  {
    id: "4",
    name: "Salmão com Quinoa",
    description: "Filé de salmão grelhado, quinoa e legumes no vapor.",
    price: 34.9,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop",
    category: "fitness",
    calories: 420,
    weight: "400g",
  },
  {
    id: "5",
    name: "Risoto de Cogumelos",
    description: "Risoto cremoso de cogumelos frescos e parmesão.",
    price: 27.9,
    image: "https://images.unsplash.com/photo-1476124369491-e7addf8db027?w=600&h=400&fit=crop",
    category: "vegetariana",
    calories: 450,
    weight: "400g",
  },
  {
    id: "6",
    name: "Carne Assada com Purê",
    description: "Carne bovina assada, purê de batata e salada verde.",
    price: 28.9,
    image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop",
    category: "tradicional",
    calories: 560,
    weight: "450g",
  },
];

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}