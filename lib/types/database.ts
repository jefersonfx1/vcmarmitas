export type OrderStatus =
  | "pendente"
  | "confirmado"
  | "preparando"
  | "enviado"
  | "entregue"
  | "cancelado";

export type ProductCategory = "tradicional" | "fitness" | "vegetariana";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: ProductCategory;
  calories: number | null;
  weight: string | null;
  active: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_cpf: string | null;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_cep: string;
  total: number;
  status: OrderStatus;
  asaas_checkout_id: string | null;
  asaas_payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
};
