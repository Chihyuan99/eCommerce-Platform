import { AppDispatch, RootState } from '../../app/store';
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import {
  removeItemFromCart,
  removeItemFromCartLocal,
  updateCartItemQuantity,
  updateCartItemQuantityLocal,
} from '../../features/cart/cartSlice';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from 'antd';
import { CartItem as Item } from '../../features/cart/cartSlice';
import React from 'react';

interface CartItemProps {
  item: Item;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  // Handle quantity decrease
  const handleDecrement = () => {
    if (item.quantity === 1) {
      handleRemove();
    } else if (item.quantity > 1) {
      if (isAuthenticated) {
        // For logged-in users, update the cart on the server
        dispatch(
          updateCartItemQuantity({
            productId: item.productId,
            quantity: item.quantity - 1,
          })
        );
      } else {
        // For unauthenticated users, update the local storage cart
        dispatch(
          updateCartItemQuantityLocal({
            productId: item.productId,
            quantity: item.quantity - 1,
          })
        );
      }
    }
  };

  const handleIncrement = () => {
    if (isAuthenticated) {
      // For logged-in users, update the cart on the server
      dispatch(
        updateCartItemQuantity({
          productId: item.productId,
          quantity: item.quantity + 1,
        })
      );
    } else {
      // For unauthenticated users, update the local storage cart
      dispatch(
        updateCartItemQuantityLocal({
          productId: item.productId,
          quantity: item.quantity + 1,
        })
      );
    }
  };

  // Handle removing an item from the cart
  const handleRemove = () => {
    if (isAuthenticated) {
      dispatch(removeItemFromCart(item.productId));
    } else {
      dispatch(removeItemFromCartLocal(item.productId));
    }
  };

  return (
    <div className='flex justify-between items-center py-4 border-b'>
      {/* Image */}
      <div className='flex-shrink-0'>
        <img
          src={item.image}
          alt={item.name}
          className='w-20 h-20 object-cover'
        />
      </div>

      {/* Item Details */}
      <div className='flex-1 px-4'>
        <div className='flex flex-col'>
          <p className='font-semibold truncate mb-2 text-lg'>{item.name}</p>
          <div className='flex items-center space-x-2 mt-2'>
            <Button
              icon={<MinusOutlined />}
              onClick={handleDecrement}
              disabled={item.quantity === 1}
              size='small'
            />
            <span>{item.quantity}</span>
            <Button
              icon={<PlusOutlined />}
              onClick={handleIncrement}
              size='small'
            />
          </div>
        </div>
      </div>

      {/* Price and Remove */}
      <div className='flex flex-col items-end text-right'>
        <p className='font-semibold text-blue-500 text-lg'>{`$${item.price.toFixed(
          2
        )}`}</p>
        <Button
          type='text'
          className='text-red-500 mt-2'
          icon={<DeleteOutlined />}
          onClick={handleRemove}
          style={{ paddingRight: 0 }}
        >
          Remove
        </Button>
      </div>
    </div>
  );
};

export default CartItem;
