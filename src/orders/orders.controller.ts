import { Controller, Get, Post, Delete, Put, Patch, Body, Param, Headers } from '@nestjs/common';
import { OrdersService } from './orders.service';

function getUserIdFromToken(authHeader: string) {
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub;
}

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --- CARRINHO ---
  @Get('cart')
  getCart(@Headers('authorization') auth: string) {
    return this.ordersService.getCart(getUserIdFromToken(auth));
  }

  @Post('cart/add')
  addToCart(@Headers('authorization') auth: string, @Body() body: any) {
    return this.ordersService.addToCart(getUserIdFromToken(auth), body);
  }

  @Delete('cart/clear')
  clearCart(@Headers('authorization') auth: string) {
    return this.ordersService.clearCart(getUserIdFromToken(auth));
  }
  
  @Delete('cart/remove/:id')
  removeFromCart(@Headers('authorization') auth: string, @Param('id') id: string) {
      return this.ordersService.removeFromCart(getUserIdFromToken(auth), id);
  }

  @Put('cart/update/:id')
  updateQuantity(
    @Headers('authorization') auth: string, 
    @Param('id') id: string, 
    @Body() body: { quantity: number }
  ) {
    return this.ordersService.updateQuantity(getUserIdFromToken(auth), id, body.quantity);
  }

  // --- PEDIDOS ---
  @Post('orders')
  createOrder(@Headers('authorization') auth: string, @Body() body: any) {
    return this.ordersService.createOrder(getUserIdFromToken(auth), body);
  }

  @Get('orders')
  getMyOrders(@Headers('authorization') auth: string) {
    return this.ordersService.getMyOrders(getUserIdFromToken(auth));
  }
  
  @Get('orders/available')
  getAvailable() {
      return this.ordersService.getAvailableOrders();
  }

  // --- ENTREGADOR ---
  
  @Get('orders/driver/active')
  getDriverActiveOrder(@Headers('authorization') auth: string) {
    return this.ordersService.getDriverActiveOrder(getUserIdFromToken(auth));
  }

  @Patch('orders/:id/accept')
  acceptOrder(@Headers('authorization') auth: string, @Param('id') id: string) {
    return this.ordersService.acceptOrder(getUserIdFromToken(auth), id);
  }

  @Patch('orders/:id/complete')
  completeOrder(@Headers('authorization') auth: string, @Param('id') id: string) {
    return this.ordersService.completeOrder(getUserIdFromToken(auth), id);
  }
}