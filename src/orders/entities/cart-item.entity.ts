import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // ID do usuário (vem do token)

  @Column()
  productId: string;

  @Column() // Guardamos dados redundantes para não consultar ms-restaurants toda hora (Microservices Pattern)
  name: string;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  price: number;

  @Column()
  image: string;

  @Column()
  storeId: string; // Importante para validar se todos itens são da mesma loja

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn()
  addedAt: Date;
}
