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
    
    // 1. Salvamos o item
    await this.cartRepo.save(cartItem);
    
    // 2. CORREÇÃO: Retornamos o carrinho completo, não apenas o item salvo
    return this.getCart(userId);
  }

  async updateStatus(orderId: string, status: string) {
    await this.orderRepo.update({ id: orderId }, { status });
    console.log(`Status do pedido ${orderId} atualizado para: ${status}`);
  }

  async removeFromCart(userId: string, id: string) {
    // Deleta pelo ID do item do carrinho, não do produto
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

  async acceptOrder(driverId: string, orderId: string) {
    await this.orderRepo.update(
      { id: orderId }, 
      { driverId, status: 'Em rota de entrega' }
    );
    return { message: 'Rota aceita!' };
  }

  async completeOrder(driverId: string, orderId: string) {
    // Em produção, validar se o pedido pertence ao motorista
    await this.orderRepo.update(
      { id: orderId }, 
      { status: 'Entregue' } // Status final que move para histórico
    );
    return { message: 'Entrega concluída!' };
  }
  
  async clearCart(userId: string) {
    await this.cartRepo.delete({ userId });
    return { message: 'Carrinho limpo' };
  }

  // --- PEDIDOS ---
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
      status: 'Aguardando Pagamento',
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
      return this.orderRepo.find({
          where: { status: 'Em preparação', driverId: IsNull() },
          relations: ['items']
      })
  }
}