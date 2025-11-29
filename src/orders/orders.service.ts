import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CartItem } from './entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(CartItem) private cartRepo: Repository<CartItem>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @Inject('PAYMENTS_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  // --- CARRINHO ---
  async getCart(userId: string) {
    const items = await this.cartRepo.find({ where: { userId } });
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    return { items, subtotal: subtotal.toFixed(2) };
  }

 async addToCart(userId: string, itemData: any) {
    let cartItem = await this.cartRepo.findOne({ where: { userId, productId: itemData.id } });

    if (cartItem) {
      cartItem.quantity += 1;
    } else {
      cartItem = this.cartRepo.create({
        userId,
        productId: itemData.id,
        name: itemData.name,
        price: itemData.price,
        image: 'placeholder',
        storeId: itemData.storeId,
        quantity: 1
      });
    }
    
    await this.cartRepo.save(cartItem);
    return this.getCart(userId);
  }

  async updateStatus(orderId: string, status: string) {
    await this.orderRepo.update({ id: orderId }, { status });
    console.log(`Status do pedido ${orderId} atualizado para: ${status}`);
  }

  async removeFromCart(userId: string, id: string) {
    await this.cartRepo.delete({ userId, id });
    return this.getCart(userId);
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    if (quantity < 1) {
      return this.removeFromCart(userId, cartItemId);
    }
    await this.cartRepo.update({ id: cartItemId, userId }, { quantity });
    return this.getCart(userId);
  }
  
  async clearCart(userId: string) {
    await this.cartRepo.delete({ userId });
    return { message: 'Carrinho limpo' };
  }

  // --- PEDIDOS (LÓGICA CORRIGIDA) ---

  async createOrder(userId: string, orderData: any) {
    const cartItems = await this.cartRepo.find({ where: { userId } });
    if (cartItems.length === 0) throw new Error('Carrinho vazio');

    const itemsTotal = cartItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const total = itemsTotal + orderData.deliveryFee;

    const order = this.orderRepo.create({
      userId,
      storeId: orderData.storeId,
      deliveryAddress: orderData.deliveryAddress,
      deliveryFee: orderData.deliveryFee,
      totalPrice: total,
      // MUDANÇA: Status inicial técnico para aparecer para o motorista
      status: 'OPEN', 
      items: cartItems.map(ci => ({
        productId: ci.productId,
        name: ci.name,
        price: ci.price,
        quantity: ci.quantity
      }))
    });

    const savedOrder = await this.orderRepo.save(order);

    await this.cartRepo.delete({ userId });

    this.rabbitClient.emit('order_created', {
      orderId: savedOrder.id,
      userId: userId,
      total: total,
      paymentMethod: 'PIX'
    });

    return savedOrder;
  }

  async getMyOrders(userId: string) {
    return this.orderRepo.find({ 
        where: { userId }, 
        order: { createdAt: 'DESC' },
        relations: ['items'] 
    });
  }
  
  async getAvailableOrders() {
      // MUDANÇA: Busca pedidos 'OPEN' (criados, mas sem motorista)
      return this.orderRepo.find({
          where: { status: 'OPEN', driverId: IsNull() },
          relations: ['items']
      })
  }

  async acceptOrder(driverId: string, orderId: string) {
    await this.orderRepo.update(
      { id: orderId }, 
      // MUDANÇA: Define status técnico 'IN_ROUTE'
      { driverId, status: 'IN_ROUTE' } 
    );
    return { message: 'Rota aceita!' };
  }

  async completeOrder(driverId: string, orderId: string) {
    await this.orderRepo.update(
      { id: orderId }, 
      // MUDANÇA: Define status técnico 'DELIVERED'
      { status: 'DELIVERED' } 
    );
    return { message: 'Entrega concluída!' };
  }
}