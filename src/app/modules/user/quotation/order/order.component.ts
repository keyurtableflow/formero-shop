import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { MatTableModule } from '@angular/material/table';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from 'app/core/user/user.service';
import { Observable, map, startWith } from 'rxjs';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-order',
    standalone: true,
    imports: [CommonModule,ReactiveFormsModule,MatCheckboxModule,MatRadioModule,FormsModule, MatTableModule, NgIf, MatExpansionModule, MatButtonModule, RouterLink, MatIconModule, MatMenuModule, MatSlideToggleModule, FuseCardComponent, MatTooltipModule, MatFormFieldModule, MatOptionModule, MatAutocompleteModule, MatSelectModule, MatInputModule],
    templateUrl: './order.component.html',
    styleUrls: ['./order.component.scss']
})
export class OrderComponent {

    columns = ['Model', 'Material', 'Specification', 'Quantity', 'Batchdiscount', 'Priceperpart', "Pricetotal", "actions"];
    rows = [
        {
            id: 1,
            Model: 'https://digifabster-media.s3.amazonaws.com/thumbs/6841abd4-b5d2-4bc2-88c0-c0ca35fdcb45b0rnh3qy.120x120.png?AWSAccessKeyId=AKIA4XIY7ZAF6N6MMAVG&Signature=bVfYivRCLZ%2BlMHNmYlxyraPUjBM%3D&Expires=1719818029',
            Material: "Onyx (black)",
            Specification: {
                Layerthickness:"125.0 µm",
                Filling: "standard",
                Color: "Black",
                Leadtime: "7-8 working days for dispatch"

            },
            Quantity: 9,
            Batchdiscount: 0.00,
            Priceperpart: 109.90,
            Pricetotal: 109.90,
            actions: ""
        },
        {
            id: 2,
            Model: 'https://digifabster-media.s3.amazonaws.com/thumbs/6841abd4-b5d2-4bc2-88c0-c0ca35fdcb45b0rnh3qy.120x120.png?AWSAccessKeyId=AKIA4XIY7ZAF6N6MMAVG&Signature=bVfYivRCLZ%2BlMHNmYlxyraPUjBM%3D&Expires=1719818029',
            Material: "Onyx (black)",
            Specification: {
                Layerthickness:"125.0 µm",
                Filling: "standard",
                Color: "Black",
                Leadtime: "7-8 working days for dispatch"

            },
            Quantity: 5,
            Batchdiscount: 0.00,
            Priceperpart: 10.52,
            Pricetotal: 10.52,
            actions: ""
        }

    ];

    countryList: any[] = [];
    filteredOptions: Observable<any[]>;
    localPickup:boolean = true;
    isCompanyOrderVisible: boolean = false;


    localPickupForm: FormGroup;
    contactForm: FormGroup;
    billingContactForm: FormGroup;
    billingAddressForm: FormGroup;

    constructor(private fb: FormBuilder, private _userService: UserService){}

    ngOnInit(): void {
        this.getCountryData();
        this.contactForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            phone: ['', [Validators.required,  Validators.pattern('^[0-9]+$')]],
            email: ['', [Validators.required, Validators.email]],
            additionalContacts: this.fb.array([])
          });

          this.billingContactForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            phone: ['', [Validators.required,  Validators.pattern('^[0-9]+$')]],
            email: ['', [Validators.required, Validators.email]],
          });

          this.localPickupForm = this.fb.group({
            company: ['', Validators.required],
            addressLine1: ['', Validators.required],
            addressLine2: [''],
            city: ['', Validators.required],
            postalCode: ['', [Validators.required,Validators.pattern('^[0-9]+$')]],
            country: ['', Validators.required]
          });

          this.billingAddressForm = this.fb.group({
            company: ['', Validators.required],
            addressLine1: ['', Validators.required],
            addressLine2: [''],
            city: ['', Validators.required],
            postalCode: ['', [Validators.required,Validators.pattern('^[0-9]+$')]],
            country: ['', Validators.required]
          });

          this.filteredOptions = this.localPickupForm.get('country').valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value || '')),
          );

    }

    selectedCountry(e:any){
        // this.localPickupForm.patchValue({
        //     country: this.countryList.find( c => c.name === e.option.value).dial_code
        // })
      }

      getCountryData(){
        this._userService.getCountries().subscribe( (res:any) => {
          this.countryList = res;
        })
      }

      toggleCompanyOrder(event: any) {
        this.isCompanyOrderVisible = event.checked;
      }

      copyContactForm(){
        this.billingContactForm.patchValue(this.contactForm.value);
      }

      copyDeliveryForm(){
        this.billingAddressForm.patchValue(this.localPickupForm.value);
      }

      private _filter(value: string): string[] {
        const filterValue = value.toLowerCase();

        return this.countryList.filter(option => option.name.toLowerCase().includes(filterValue));
      }
}
