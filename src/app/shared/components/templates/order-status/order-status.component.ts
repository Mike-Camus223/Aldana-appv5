import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArrowDownToLine, Book, BookCheck, Check, Headset, House, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, NotepadText, Package, Truck } from 'lucide-angular';

interface Step {
  id: number;
  label: string;
  date: string;
  active: boolean;
  completed: boolean;
  time: string;
  icon: string
}

interface Product {
  name: string;
  quantity: number;
  price: string;
  image: string;
}

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule,LucideAngularModule],
  providers: [
        {
          provide: LUCIDE_ICONS,
          multi: true,
          useValue: new LucideIconProvider({
            Check,
            NotepadText,
            BookCheck,
            Book,
            Package,
            Truck,
            House,
            Headset,
            ArrowDownToLine
          })
        }
      ],
  templateUrl: './order-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusComponent {
  orderId = '#1123123';
  orderDate = '08 Feb 2023';
  status = 'En envío';

  steps: Step[] = [
    { id: 1, label: 'Pedido confirmado', date: '08 Feb 2023', time: '10:15 AM', active: true, completed: true, icon: 'book' },
    { id: 2, label: 'Pedido aceptado', date: '10 Feb 2023', time: '03:30 PM', active: true, completed: true, icon: 'book-check' },
    { id: 3, label: 'En preparación', date: 'Est. 15 Feb 2023', time: '09:00 AM', active: true, completed: true, icon: 'package' },
    { id: 4, label: 'En camino', date: '—', time: '—', active: false, completed: false, icon: 'truck' },
    { id: 5, label: 'Entregado en domicilio', date: '—', time: '—', active: false, completed: false, icon: 'house' },
  ];
  
  

  shipping = {
    courier: 'FedEx',
    tracking: 'SSA4569AEF4592',
    trackingUrl: 'https://tracking-link.com',
    address: 'Calle Falsa 123, Buenos Aires, Argentina',
    estimated: '15 Feb 2023',
  };

  payment = {
    platform: 'Mercado Pago',
    status: 'Confirmado',
  };

  products: Product[] = [
    {
      name: 'Aros Dior Tribales Beige',
      quantity: 1,
      price: '$450.00 USD',
      image: 'https://via.placeholder.com/60',
    },
    {
      name: 'Zapatos Slingback Mizza',
      quantity: 1,
      price: '$450.00 USD',
      image: 'https://via.placeholder.com/60',
    },
  ];

  costs = {
    subtotal: '$900.00',
    shipping: 'Gratis',
    total: '$700.00',
    discount: 200
  };
}
