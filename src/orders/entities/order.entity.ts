import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  storeId: string;

  @Column({ nullable: true })
  driverId: string;

  // CORREÇÃO: Define o padrão como 'OPEN' para que o pedido nasça visível
  @Column({ default: 'OPEN' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  deliveryFee: number;

  @Column('text')
  deliveryAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}