import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, CdkScrollable, ReactiveFormsModule, MatProgressSpinnerModule,MatDatepickerModule, MatCheckboxModule, MatRadioModule, FormsModule, MatTableModule, NgIf, MatExpansionModule, MatButtonModule, RouterLink, MatIconModule, MatMenuModule, MatSlideToggleModule, FuseCardComponent, MatTooltipModule, MatFormFieldModule, MatOptionModule, MatAutocompleteModule, MatSelectModule, MatInputModule, MatSnackBarModule],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent {

    orders = [
        { id: '#QUO-1487', url: '3 models',parts:3, status: 'Cart saved', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#QUO-1497', url: '1 models',parts:4, status: 'Quote requested', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#QUO-1498', url: '3 models ',parts:5, status: 'Quote created', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#ORD-1497', url: '1 models', parts:6,status: 'Order placed', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#QUO-1487', url: '3 models ',parts:3, status: 'Cart saved', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#QUO-1497', url: '1 models',parts:4, status: 'Quote requested', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#QUO-1498', url: '3 models ',parts:5, status: 'Quote created', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#ORD-1497', url: '1 models', parts:6,status: 'Order placed', date: new Date('2024-08-12'), price: 0.0 },{ id: '#QUO-1487', url: '3 models 9 parts',parts:3, status: 'Cart saved', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#QUO-1497', url: '1 models',parts:4, status: 'Quote requested', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#QUO-1498', url: '3 models ',parts:5, status: 'Quote created', date: new Date('2024-08-12'), price: 0.0 },
        { id: '#ORD-1497', url: '1 models', parts:6,status: 'Order placed', date: new Date('2024-08-12'), price: 0.0 },
      ];

      filterStatus = ["All","Quotes","Orders","Saved","Abandoned"]

}
