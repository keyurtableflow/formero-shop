import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
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
import { Router, RouterLink } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { QuotationService } from 'app/core/services/quotation.service';
import { StepService } from 'app/core/services/step.service';
import { QuotationStatus } from 'app/core/models/quotation-status.enum';
import { CommonService } from 'app/core/common/common.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { VolumeData } from 'app/modules/user/quotation/modelviewer/modelviewer.component';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, CdkScrollable, ReactiveFormsModule,NgFor, MatProgressSpinnerModule, MatDatepickerModule, MatCheckboxModule, MatRadioModule, FormsModule, MatTableModule, NgIf, MatExpansionModule, MatButtonModule, RouterLink, MatIconModule, MatMenuModule, MatSlideToggleModule, FuseCardComponent, MatTooltipModule, MatFormFieldModule, MatOptionModule, MatAutocompleteModule, MatSelectModule, MatInputModule, MatSnackBarModule],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent {

  filesList: any[] = [];
  cartItems: CartItem[] = [];
  masterCartItems: CartItem[] = [];
  processList: any[] = [];
  isCartHaveModelAdded: boolean = false;


  isEditingCart: boolean = false;
  printingCost: number = 0
  startupFee: number = 0;
  extrasCost: number = 0;
  selectedQuantity: number = 1;
  previousQuantity: number = 1;
  selectedProcessId: string | null = null;
  selectedProcessIndex: number;
  printerSize: { X: number; Y: number; Z: number } = { X: 0, Y: 0, Z: 0 }
  selectedItemId: string | null = null;
  files: any;
  isYourOrderShow: boolean = false;
  isCustomiseModelShow: boolean = true;
  count = 0;
  cartSubTotal: number = 0;
  cartGstCost: number = 0
  cartTotatCost: number = 0;
  materialList: any[] = [];
  finishesList: any[] = [];
  extrasList: any[] = [];
  shouldShowOnSaleBatch: boolean = false;
  selectedMaterial: any;
  selectedFinish: any;
  selectedExtras: any[] = []
  totalDiscount: number = 0;
  volumeData: VolumeData;
  errors: { isMetricError: boolean, model_is_fit: boolean } = { isMetricError: false, model_is_fit: true };
  selectedDuration: string = '6 months'; // Default selection
  filteredCartItems: any[] = [];
  visibleItems: number = 6;
  selectedStatus: string | null = null;
  filterStatus = ["All", "Quotes", "Orders", "Saved", "Abandoned"];

  constructor(private stepService: StepService, private commonService: CommonService, private _fuseConfirmationService: FuseConfirmationService,
    private _quotationService: QuotationService, private _router: Router
  ) { }

  ngOnInit(): void {
    this.selectedStatus = "All";
    this.getProcessList().then(() => {
      this.getQuotation();
    });

  }

  showAllItems() {
    this.visibleItems = this.cartItems.length;  // Show all items
  }

  // Handle the selection from the dropdown
  onSelect(duration: any) {
    this.selectedDuration = duration;
    // Perform any logic based on the selected duration here
    let url = '?';
    url += `month=${this.selectedDuration}`;
    
    if (this.selectedStatus) {
      switch (this.selectedStatus) {
        case "All":
          this.visibleItems = 6;
          url += '&skip_pagination=true';
          break;
        case "Quotes":
          url += `&search=${QuotationStatus.QuoteCreated}`;
          break;
        case "Orders":
          url += `&search=${QuotationStatus.OrderPlaced}`;
          break;
        case "Saved":
          url += `&search=${QuotationStatus.SaveAndExitQuote}`;
          break;
        case "Abandoned":
          url += `&search=${QuotationStatus.QuoteCancel}`;
      }
    
    }
    
    this._quotationService.getQuotation(url).subscribe((res) => {
      this.cartItems = res.data.result.map(i => {
        const processedItems = [];

        // Check if `i.items` exists and is an array
        if (Array.isArray(i.items)) {
          i.items.forEach(item => {
            const { process_id, material_id, finishes_ids, extras_ids, ...otherData } = item;

            // Extract only the `extras_id` from each entry in `extras_ids` array
            const formattedExtrasIds = extras_ids ? extras_ids.map(extra => extra.extras_id) : [];

            // Create the processed item object
            const processedItem = {
              ...otherData,
              file: {
                name: item.model_name,
                _id: item._id,
                is_cart: item.is_cart,
                thumbnail: item?.thumbnail,
                items: item // Push the entire item object here if needed
              },
              quantity: item?.quantity ? item.quantity : 1,
              processId: process_id,
              materialId: material_id,
              finishes_ids: finishes_ids,
              extras_ids: formattedExtrasIds,
              position: { x: '0', y: '0', z: '0' },
              volume: '0',
              surface_area: '0',
              errors: null
            };

            // Push the processed item into the `processedItems` array
            processedItems.push(processedItem);
          });
        }
        return {
          ...i,
          processedItems
        };
      });

      this.masterCartItems = this.cartItems;
      this.isCartHaveModelAdded = this.cartItems.some(item => item.is_cart);
    });
  }

  filterActivity(activity: any) {
    this.selectedStatus = activity;
    this.getQuotation();
  }

  getQuotation(isCartPanelOpen: boolean = false) {

    let url = '?';

    switch(this.selectedStatus){
        case "All":
              this.visibleItems = 6;
              url += 'skip_pagination=true';
             break;
        case "Quotes":
               url += `search=${QuotationStatus.QuoteCreated}`
              break;
        case "Orders":
              url += `search=${QuotationStatus.OrderPlaced}`
             break;
        case "Saved":
              url += `search=${QuotationStatus.SaveAndExitQuote}`
             break;
        case "Abandoned":
              url += `search=${QuotationStatus.QuoteCancel}`
    }

      this._quotationService.getQuotation(url).subscribe((res) => {
        this.cartItems = res.data.result.map(i => {
          const processedItems = [];

          // Check if `i.items` exists and is an array
          if (Array.isArray(i.items)) {
            i.items.forEach(item => {
              const { process_id, material_id, finishes_ids, extras_ids, ...otherData } = item;

              // Extract only the `extras_id` from each entry in `extras_ids` array
              const formattedExtrasIds = extras_ids ? extras_ids.map(extra => extra.extras_id) : [];

              // Create the processed item object
              const processedItem = {
                ...otherData,
                file: {
                  name: item.model_name,
                  _id: item._id,
                  is_cart: item.is_cart,
                  thumbnail: item?.thumbnail,
                  items: item // Push the entire item object here if needed
                },
                quantity: item?.quantity ? item.quantity : 1,
                processId: process_id,
                materialId: material_id,
                finishes_ids: finishes_ids,
                extras_ids: formattedExtrasIds,
                position: { x: '0', y: '0', z: '0' },
                volume: '0',
                surface_area: '0',
                errors: null
              };

              // Push the processed item into the `processedItems` array
              processedItems.push(processedItem);
            });
          }
          return {
            ...i,
            processedItems
          };
        });

        this.masterCartItems = this.cartItems;
        this.isCartHaveModelAdded = this.cartItems.some(item => item.is_cart);
      });
  }


  // create order page redirection.
  redirectOrder() {
    this._router.navigateByUrl('/create-order');
  }

  // view quotation redirection.
  viewRedirection(type:any){
    this._router.navigateByUrl('/create-order');
    if(type == "Cart saved"){
      this._router.navigateByUrl('/order-details');
    }
    if(type == "Save and exit cart" || type == "Save and Exit quote"){
      this._router.navigateByUrl('/upload-models');
    }
    if(type == "Finalise quote"){
      this._router.navigateByUrl('/confirmation');
    }
  }

  getProcessList(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._quotationService.getAllProcessList('skip_pagination=true').subscribe((result) => {
        if (result.statusCode === 200) {
          this.processList = result?.data.result;
          resolve();
        }
      }, (error: any) => {
        if (error.status === 401) {
          this._router.navigateByUrl('sign-in');
        }
        this.showError(error);
        reject(error);
      });
    });
  }

  showError(err: any) {
    let alert = {
      "title": "Error",
      "message": err.error.message,
      "icon": {
        "show": true,
        "name": "heroicons_outline:exclamation-triangle",
        "color": "warn"
      },
      "actions": {
        "confirm": {
          "show": false,
          "label": "Okay",
          "color": "warn"
        },
        "cancel": {
          "show": true,
          "label": "Okay"
        }
      }
    };
    this.openConfirmationDialog(alert);
  }

  openConfirmationDialog(data: any): void {
    this._fuseConfirmationService.open(data);
  }

}

interface CartItem {
  _id?: string;
  file: any;
  processId: string;
  materialId: string;
  finishes_ids: { finishes_id: string }[];
  extras_ids: { extras_id: string }[];
  quantity: number;
  is_cart: boolean;
  price?: number;
  model: string;
  position: { x: string, y: string, z: string };
  volume: string;
  surface_area: string;
  errors: { error: string }[];
  instant_quote: boolean,
  require_review: boolean,
  order_value: number,
  applied_proccess_dicount: number,
  thumbnail?: string,
  model_is_fit: boolean,
  is_metrics_error: boolean
}
