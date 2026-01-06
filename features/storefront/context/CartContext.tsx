"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface CartModifier {
  id: string;
  name: string;
  priceAdjustment: string;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
  specialInstructions: string;
  modifiers: CartModifier[];
}

export interface CartState {
  items: CartItem[];
  orderType: 'dine_in' | 'takeout' | 'delivery';
  tableNumber?: string;
  specialInstructions: string;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_INSTRUCTIONS'; payload: { id: string; instructions: string } }
  | { type: 'SET_ORDER_TYPE'; payload: 'dine_in' | 'takeout' | 'delivery' }
  | { type: 'SET_TABLE_NUMBER'; payload: string }
  | { type: 'SET_ORDER_INSTRUCTIONS'; payload: string }
  | { type: 'CLEAR_CART' };

// Initial state
const initialState: CartState = {
  items: [],
  orderType: 'dine_in',
  specialInstructions: '',
};

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item =>
          item.menuItemId === action.payload.menuItemId &&
          JSON.stringify(item.modifiers) === JSON.stringify(action.payload.modifiers) &&
          item.specialInstructions === action.payload.specialInstructions
      );

      if (existingItemIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems };
      }

      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case 'UPDATE_INSTRUCTIONS':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, specialInstructions: action.payload.instructions }
            : item
        ),
      };
    case 'SET_ORDER_TYPE':
      return { ...state, orderType: action.payload };
    case 'SET_TABLE_NUMBER':
      return { ...state, tableNumber: action.payload };
    case 'SET_ORDER_INSTRUCTIONS':
      return { ...state, specialInstructions: action.payload };
    case 'CLEAR_CART':
      return initialState;
    default:
      return state;
  }
}

// Context
interface CartContextValue {
  state: CartState;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  setOrderType: (type: 'dine_in' | 'takeout' | 'delivery') => void;
  setTableNumber: (tableNumber: string) => void;
  setOrderInstructions: (instructions: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'ADD_ITEM', payload: { ...item, id } });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const updateInstructions = (id: string, instructions: string) => {
    dispatch({ type: 'UPDATE_INSTRUCTIONS', payload: { id, instructions } });
  };

  const setOrderType = (type: 'dine_in' | 'takeout' | 'delivery') => {
    dispatch({ type: 'SET_ORDER_TYPE', payload: type });
  };

  const setTableNumber = (tableNumber: string) => {
    dispatch({ type: 'SET_TABLE_NUMBER', payload: tableNumber });
  };

  const setOrderInstructions = (instructions: string) => {
    dispatch({ type: 'SET_ORDER_INSTRUCTIONS', payload: instructions });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getSubtotal = () => {
    return state.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price);
      const modifiersPrice = item.modifiers.reduce(
        (sum, mod) => sum + parseFloat(mod.priceAdjustment || '0'),
        0
      );
      return total + (itemPrice + modifiersPrice) * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        updateInstructions,
        setOrderType,
        setTableNumber,
        setOrderInstructions,
        clearCart,
        getSubtotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
