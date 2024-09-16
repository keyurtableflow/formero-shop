import { Routes } from '@angular/router';
import { QuotationComponent } from './quotation.component';
import { OrderComponent } from './order/order.component';



export default [
    {
        path     : '',
        component: QuotationComponent,
    },
    {
        path     : 'order',
        component: OrderComponent,
    },
] as Routes;
