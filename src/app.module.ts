import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { CartItem } from './orders/entities/cart-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3303,
      username: 'root',
      password: 'root',
      database: 'projeto5_orders',
      entities: [Order, OrderItem, CartItem],
      synchronize: true,
      logging: true,
      connectTimeout: 20000,
    }),
    OrdersModule, // Garanta que aparece apenas uma vez aqui
  ],
})
export class AppModule {}