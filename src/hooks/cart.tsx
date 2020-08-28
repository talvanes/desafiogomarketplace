import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // LOAD ITEMS FROM ASYNC STORAGE
      const cart = await AsyncStorage.getItem('@GoMarketplace:cart');

      const storagedProducts = cart ? (JSON.parse(cart) as Product[]) : [];

      setProducts(storagedProducts);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      // ADD A NEW ITEM TO THE CART
      const index = products.findIndex(item => item.id === product.id);

      if (index < 0) {
        const newProduct = {
          ...product,
          quantity: 1,
        };

        setProducts([...products, newProduct]);
      }

      // Update AsyncStorage
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products, setProducts],
  );

  const increment = useCallback(
    async id => {
      // INCREMENTS A PRODUCT QUANTITY IN THE CART
      const item = products.find(product => product.id === id);

      if (item) {
        const index = products.indexOf(item);

        const updatedItem = {
          ...item,
          quantity: item.quantity + 1,
        };

        setProducts([
          ...products.slice(0, index),
          updatedItem,
          ...products.slice(index + 1),
        ]);
      }

      // Update AsyncStorage
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products, setProducts],
  );

  const decrement = useCallback(
    async id => {
      // DECREMENTS A PRODUCT QUANTITY IN THE CART
      const item = products.find(product => product.id === id);

      if (item && item.quantity > 1) {
        const index = products.indexOf(item);

        const updatedItem = {
          ...item,
          quantity: item.quantity - 1,
        };

        setProducts([
          ...products.slice(0, index),
          updatedItem,
          ...products.slice(index + 1),
        ]);
      }

      // Update AsyncStorage
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products, setProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
