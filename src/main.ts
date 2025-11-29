import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- ADICIONAR CONEXÃO RABBITMQ ---
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://user:password@localhost:5672'],
      queue: 'payments_queue', // Escuta a fila onde o ms-payments posta o resultado
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
  // ----------------------------------

  await app.listen(process.env.PORT ?? 3003);
  console.log(`Microserviço de Pedidos (ms-orders) rodando na porta 3003 e ouvindo RabbitMQ`);
}
bootstrap();