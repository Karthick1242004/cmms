export interface Part {
  id: string
  name: string
  sku: string
  quantity: number
  location?: string
  department: string // Department that manages this part
  description?: string
  price?: number
  minStockLevel?: number
}

export interface PartUpdateData extends Partial<Omit<Part, "id" | "quantity">> {}
