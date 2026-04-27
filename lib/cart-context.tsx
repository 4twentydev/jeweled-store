"use client"

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react"
import type { CartItem } from "@/types"

type CartState = {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: "ADD"; payload: CartItem }
  | { type: "REMOVE"; productId: string }
  | { type: "SET_QTY"; productId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "HYDRATE"; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, items: action.items }
    case "ADD": {
      const existing = state.items.find((i) => i.productId === action.payload.productId)
      if (existing) {
        const newQty = Math.min(
          existing.quantity + action.payload.quantity,
          action.payload.maxStock
        )
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: newQty, maxStock: action.payload.maxStock }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, action.payload] }
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) }
    case "SET_QTY": {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== action.productId) }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      }
    }
    case "CLEAR":
      return { ...state, items: [] }
    case "OPEN":
      return { ...state, isOpen: true }
    case "CLOSE":
      return { ...state, isOpen: false }
  }
}

type CartContextValue = {
  items: CartItem[]
  isOpen: boolean
  itemCount: number
  subtotalCents: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  openCart: () => void
  closeCart: () => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "jwld-cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "HYDRATE", items: parsed })
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotalCents = state.items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        itemCount,
        subtotalCents,
        addItem: (item) => dispatch({ type: "ADD", payload: item }),
        removeItem: (productId) => dispatch({ type: "REMOVE", productId }),
        setQuantity: (productId, quantity) =>
          dispatch({ type: "SET_QTY", productId, quantity }),
        openCart: () => dispatch({ type: "OPEN" }),
        closeCart: () => dispatch({ type: "CLOSE" }),
        clearCart: () => dispatch({ type: "CLEAR" }),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
