export interface Part {
  id: string
  name: string
  sku: string
  quantity: number
  location?: string
  description?: string
  price?: number
  minStockLevel?: number
}

export interface PartUpdateData extends Partial<Omit<Part, "id" | "quantity">> {}
