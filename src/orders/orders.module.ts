import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from './entities/cart-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, CartItem]),
    // Configuração do Cliente RabbitMQ (para enviar mensagens)
    ClientsModule.register([
      {
        name: 'PAYMENTS_SERVICE', // Nome que usaremos para injetar no Service
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://user:password@localhost:5672'], // Gateway para o RabbitMQ
          queue: 'orders_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
