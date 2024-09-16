import { AfterContentInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StepService } from 'app/core/services/step.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseCardComponent } from '@fuse/components/card';
import { ModelviewerComponent, VolumeData } from '../quotation/modelviewer/modelviewer.component';
import * as JSZip from 'jszip';
import { QuotationService } from 'app/core/services/quotation.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FileManagementService } from 'app/core/services/file-management.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FuseLoadingService } from '@fuse/services/loading';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonService } from 'app/core/common/common.service';
import { QuotationStatus } from 'app/core/models/quotation-status.enum';
import { fuseAnimations } from '@fuse/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-create-order',
    standalone: true,
    imports: [CommonModule, NgIf, NgFor, MatExpansionModule,MatProgressSpinnerModule, FormsModule, MatButtonModule, RouterLink, MatIconModule, MatMenuModule, MatSlideToggleModule, FuseCardComponent, MatTooltipModule, MatFormFieldModule, MatOptionModule, MatAutocompleteModule, MatSelectModule, MatInputModule, ModelviewerComponent, MatCheckboxModule, MatSnackBarModule],
    templateUrl: './create-order.component.html',
    styleUrls: ['./create-order.component.scss'],
    animations: fuseAnimations,
})
export class CreateOrderComponent implements OnInit {

    formCompleted = false;
    isOpen: boolean = false;
    count = 0;
    showAllProcess = false;
    isModelUploding:boolean = false;
    shouldShowOnSaleBatch: boolean = false;

    // on copy model
    isModelUploaded: boolean = true;
    onExpandCopyModel: boolean = false;


    // your order show
    isYourOrderShow: boolean = false;
    isCustomiseModelShow: boolean = true;

    isCopyFromModelShow: boolean = false;
    isEditingCart: boolean = false;
    isCartHaveModelAdded: boolean = false;

    files: any;
    filesList: any[] = [];
    selectedItemId: string | null = null;
    degree: any = 270;
    printerSize: { X: number; Y: number; Z: number } = { X: 0, Y: 0, Z: 0 }

    processList: any[] = [];
    materialList: any[] = [];
    cachedImageUrls: Map<string, SafeUrl> = new Map();
    extrasList: any[] = [];
    finishesList: any[] = [];

    cartItems: CartItem[] = [];
    selectedQuantity: number = 1;
    selectedProcessId: string | null = null;
    selectedProcessIndex: number;
    selectedMaterial: any;
    selectedFinish: any;
    selectedExtras: any[] = []

    quotationId: string;
    fileListPath: any[] = [];

    // Price calucation
    totalDiscount : number =  0;
    printingCost: number = 0
    startupFee: number = 0;
    extrasCost: number = 0;
    // postProductionCost: number = 0
    previousQuantity: number = 1;

    // Price calucation for cart
    cartItemCost: number = 0
    cartGstCost: number = 0
    cartSubTotal: number = 0;
    cartTotatCost: number = 0;

    // Volumedata
    volumeData: VolumeData;

    constructor(private stepService: StepService, private route: ActivatedRoute,
        private _quotationService: QuotationService, private _router: Router, private _fuseConfirmationService: FuseConfirmationService,
        private _fileManagementService: FileManagementService, private sanitizer: DomSanitizer, private _commonService: CommonService
    ) { }

    get subTotal(): number {
        return this.printingCost + this.startupFee + this.extrasCost;
    }

    get totatCost(): number {
        return this.subTotal + this.gstCost;
    }

    get gstCost(): number {
        return +((this.subTotal * 10) / 100).toFixed(2);
    }

    get printingCostPerPart(): number {
        return +(this.printingCost / this.selectedQuantity).toFixed(2);
    }


    ngOnInit(): void {
        this.quotationId = this._quotationService.getQuotationId();
        if (!this.quotationId) {
            this._router.navigate(['/upload-models'])
        }
        this.getProcessList().then(() => {
            this.getQuotation();
        });

    }

    completeForm() {
        this.stepService.setStepCompleted(1, true);
        const amountDetails = {
            "subtotal": this.cartSubTotal,
            "tax": this.cartGstCost,
            "discount": 0,
            "total": this.cartTotatCost,
            "currency": "USD",
        }
        this._quotationService.updateQuotation(this.quotationId, { amount_details: amountDetails, total_amount: this.cartTotatCost, quotation_status: QuotationStatus.CartSaved, }).subscribe((res) => {
            this._commonService.openSnackBar("Cart details saved successfully")
            this.stepService.setStepCompleted(1, true);
            this._router.navigate(['order-details'])
        });
    }



    toggleAccordion() {
        this.isOpen = !this.isOpen;
    }

    onExpandCopyModelToggle() {
        this.onExpandCopyModel = !this.onExpandCopyModel;
    }


    calculateCartCosts(): void {
        const itemsInCart = this.cartItems.filter(item => item.is_cart);
        this.cartSubTotal = itemsInCart.reduce((sum, item) => sum + (item.price || 0), 0);
        this.cartGstCost = +((this.cartSubTotal * 10) / 100).toFixed(2);
        this.cartTotatCost = this.cartSubTotal + this.cartGstCost;
    }

    onExpandOrder() {
        this.isYourOrderShow = !this.isYourOrderShow;
        this.count += 1;
        if (this.isYourOrderShow) {
            this.calculateCartCosts();
        }
    }

    toggelCustomiseModel() {
        this.isCustomiseModelShow = !this.isCustomiseModelShow;
    }


    getQuotation(isCartPanelOpen: boolean = false) {
        if (this.quotationId) {
            this._quotationService.getQuotationById(this.quotationId).subscribe((res) => {
                console.log(res,"res")
                this.isModelUploding = false;
                if(res.data.result.quotation_status == QuotationStatus.InReview || res.data.result.quotation_status == QuotationStatus.FinaliseQuote ){
                    this.stepService.setStepCompleted(1, true);
                    this._router.navigate(['order-details']);
                    this._commonService.openErrorSnackBar("Your quote is in review. you can not changed any details.")
                }
                this.filesList = res.data.result.items.reduce((acc, item) => {
                    console.log(res,"res test")
                    if (!item.is_cart) {
                        acc.push({
                            url: this.get3dFile(item.model),
                            name: item.model_name,
                            _id: item._id,
                            is_cart: item.is_cart,
                            thumbnail :item?.thumbnail
                        });
                    }
                    return acc;
                }, []);


                this.cartItems = res.data.result.items.map((item) => {
                    const { process_id, material_id, finishes_ids, extras_ids, ...otherData } = item;

                    // Extract only the `extras_id` from each entry in `extras_ids` array
                    const formattedExtrasIds = extras_ids ? extras_ids.map(extra => extra.extras_id) : [];

                    return {
                        ...otherData,
                        file: {
                            url: this.get3dFile(item.model),
                            name: item.model_name,
                            _id: item._id,
                            is_cart: item.is_cart,
                            thumbnail : item?.thumbnail
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
                });
                this.isCartHaveModelAdded = this.cartItems.some(item => item.is_cart);

                if (this.filesList.length) {
                    this.onFileSelected(this.filesList[0], isCartPanelOpen);
                } else {
                    setTimeout(() => {
                        this.onExpandOrder();
                        this.toggelCustomiseModel()
                    }, 200);
                }
                this.calculateCartCosts();
            });
        }
    }

    onThumbnail(event){
        let selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        if(!selectedItem.thumbnail){
            selectedItem.thumbnail = event;
            let file = this.filesList.find(item => item._id === this.selectedItemId);
            file.thumbnail = event;
            this._quotationService.updateModelInCart(this.quotationId, selectedItem._id, selectedItem).subscribe((result) => {
                this.getQuotation(true);
                this.isCustomiseModelShow = false;
                this.isYourOrderShow = true
                this.resetSelections();
            }, (error) => {
                this._commonService.openErrorSnackBar(error.message);
            });
        }
    }


    selectModelFromCart(itemId: string) {
        this.selectedItemId = itemId;
        this.isEditingCart = true; // Set the flag for editing cart mode

        // Pre-select process, material, finishes, and quantity based on selected cart item
        const selectedItem = this.cartItems.find(item => item.file._id === itemId);
        if (selectedItem) {
            this.files = selectedItem.file; // Load the model into app-modelviewer
            this.selectedProcessId = selectedItem.processId;
            this.selectedProcessIndex = this.processList.findIndex(p => p._id === this.selectedProcessId);
            this.selectedMaterial = this.materialList.find(mat => mat._id === selectedItem.materialId);
            this.getMaterialBasedOnProcess(this.selectedProcessId, selectedItem.materialId, true);
            this.selectedQuantity = selectedItem.quantity;
            this.previousQuantity = selectedItem.quantity;
            setTimeout(() => {
                this.onExpandOrder();
                this.toggelCustomiseModel();
            }, 200);

            //   this.updateCosts();
        }
    }


    updateCosts(): void {
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        const selectedProcess = this.processList.find(f => f._id == selectedItem.processId);

        this.shouldShowOnSaleBatch = false;
        if (selectedItem) {
            this.getProcessPrice(selectedItem.processId).then(processCost => {
                 this.totalDiscount = 0; // Initialize total discount to 0
                const currentDate = new Date();

                // Iterate through all promotions and apply the applicable discounts
                for (const promotion of selectedProcess.promotionsData) {
                    const { method, dollar, percentage } = promotion.discount;

                    // Extract start and end dates for the promotion
                    const startDate = promotion.limit.start_date ? new Date(promotion.limit.start_date) : null;
                    const endDate = promotion.limit.end_date ? new Date(promotion.limit.end_date) : null;

                    // Check if promotion is active and within the date range
                    if (
                      promotion.is_active && promotion.used_count < promotion.limit.usage &&
                      (
                        // Case 1: Both start and end dates are provided
                        (startDate && endDate && startDate <= currentDate && endDate >= currentDate) ||
                        // Case 2: Only start date is provided
                        (startDate && !endDate && startDate <= currentDate) ||
                        // Case 3: Only end date is provided
                        (!startDate && endDate && endDate >= currentDate) ||
                        // Case 4: No start or end dates are provided
                        (!startDate && !endDate)
                      ) &&
                      promotion?.qualifiers?.processes.some(p => p.processId === selectedProcess._id) &&
                      (!promotion.qualifiers.code || promotion.qualifiers.code.trim() === '')
                    ) {
                      // Apply the discount based on the promotion method
                      if (method === 1) {
                        // Method 1: Fixed dollar discount
                        this.totalDiscount += dollar;
                      } else if (method === 2) {
                        // Method 2: Percentage discount
                        this.totalDiscount += (processCost * (percentage / 100));
                      }

                      if (this.totalDiscount > 0 && promotion.qualifiers.show_cta) {
                        this.shouldShowOnSaleBatch = true;
                      }

                    }
                  }
                selectedItem.applied_proccess_dicount = this.totalDiscount;
                // Apply total discount to process cost
                processCost = Math.max(0, processCost - this.totalDiscount);
                this.printingCost = processCost * selectedItem.quantity; // Calculate printing cost only from process
                // Calculate startup fee and extras cost
                this.startupFee = this.calculateStartupFee(selectedItem.materialId, selectedItem.quantity);
                this.extrasCost = this.calculateExtrasCost(selectedItem.extras_ids, selectedItem.quantity);
            });
        }
    }

    calculateStartupFee(materialId: string, quantity: number): number {
        const material = this.materialList.find(m => m._id === materialId);
        const startupFee = material ? +material.set_up_fee.$numberDecimal : 0;
        return startupFee * quantity; // Calculate startup fee based on quantity
    }


    calculateExtrasCost(extras: any[], quantity: number): number {
        // Find the cost of each extra by its ID
        const extrasCost = extras.reduce((sum, extraId) => {
            const extraDetail = this.extrasList.find(e => e._id === extraId); // Find the extra by ID
            return sum + (extraDetail ? +extraDetail.price.$numberDecimal : 0); // Add its cost if found
        }, 0);

        return extrasCost * quantity; // Calculate extras cost based on quantity
    }



    getProcessCost(processId: string): number {
        const process = this.processList.find(p => p._id === processId);
        if (process && process.pricingModelsData) {
            return process.pricingModelsData.finalPrice ?? 0; // Return the final price from the process
        }
        return 0; // Default to 0 if no process is found or no price is set
    }

    getMaterialCost(materialId: string): number {
        const material = this.materialList.find(m => m._id === materialId);
        return material ? +Number(material.price) : 0;
    }


    // --------------------------------------------File Upload Logic start--------------------------------------------------

    onFileChange(event: any) {
        debugger
        if (this.filesList.length + event?.target?.files.length > 20) {
            this.showError({ error: { message: "Cannot add more than 20 items to the rail." } });
            return;
        }
        this.fileListPath = [];
        let isAllFilesValid = true;
        const processPromises: Promise<void>[] = [];

        for (let i = 0; i < event?.target?.files.length; i++) {
            if (this.isFileSizeValid(event?.target?.files[i])) {
                processPromises.push(this.processFile(event?.target?.files[i]));
            } else {
                isAllFilesValid = false;
                this.showError({ error: { message: `The file "${event?.target?.files[i].name}" exceeds the 100 MB size limit.` } });
                break;
            }
        }

        if (isAllFilesValid) {
            this.isModelUploding = true;
            Promise.all(processPromises).then(() => {
                this.uploadAllFiles();
            }).catch((error) => {
                this.showError(error);
                this.isModelUploding = false;
            });
        }

    }

    isFileSizeValid(file: File): boolean {
        const maxSizeInMB = 100;
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        return file.size <= maxSizeInBytes;
    }

    processFile(file: File): Promise<void> {
        if (file.name.endsWith('.zip')) {
            return this.handleZip(file);
        } else {
            return this.addToFileList(file);
        }
    }

    handleZip(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const contents = event.target?.result;
                if (!contents || typeof contents === 'string') return;

                JSZip.loadAsync(contents as ArrayBuffer).then((zip) => {
                    const zipExtractPromises: Promise<void>[] = [];
                    zip.forEach((relativePath, zipEntry) => {
                        zipExtractPromises.push(
                            zipEntry.async('arraybuffer').then((fileData) => {
                                const blob = new Blob([fileData]);
                                const extractedFile = new File([blob], zipEntry.name);
                                return this.addToFileList(extractedFile);
                            })
                        );
                    });

                    Promise.all(zipExtractPromises).then(() => {
                        resolve();
                    }).catch(reject);
                });
            };
            reader.readAsArrayBuffer(file);
        });
    }

    addToFileList(file: File): Promise<void> {
        return new Promise((resolve) => {
            this.fileListPath.push(file);
            resolve();
        });
    }

    uploadAllFiles() {
        this.isModelUploding = true;
        const formData = new FormData();
        if (this.fileListPath.length === 1) {
            formData.append('files', this.fileListPath[0]);
            this._fileManagementService.uploadSingleFile("3dFiles", formData).subscribe((res) => {
                if (res?.statusCode == 200) {
                    this.fileListPath = [res.data];
                    this.updateQuotation();
                } else {
                    this.showError({ error: { message: 'File upload failed' } });
                }
            }, (error: any) => {
                this.showError(error);
            });
        } else if (this.fileListPath.length > 1) {
            this.fileListPath.forEach(file => {
                formData.append('file', file);
            });
            this._fileManagementService.uploadMultipleFiles("3dFiles", formData).subscribe((res) => {
                if (res?.statusCode == 200) {
                    this.fileListPath = res.data.files;
                    this.updateQuotation();
                } else {
                    this.showError({ error: { message: 'File upload failed' } });
                }
            }, (error: any) => {
                this.showError(error);
            });
        }
    }

    getQuotationPayload(files: any[]) {
        return {
            items: files.map(data => ({ model: data.filepath ,model_name:data?.filename}))
        };
    }

    updateQuotation() {
        const payload = this.getQuotationPayload(this.fileListPath);
        this._quotationService.addModelInQuatation(this.quotationId, payload).subscribe((res) => {
            if (res?.statusCode == 200) {
                this.getQuotation();
            }
        }, (error: any) => {
            this.showError(error);
            this.isModelUploding = false;
        });
    }
    // ------------------------------------- File Upload Logic End---------------------------------------

    onFileSelected(file: any, isCartPanelOpen?: boolean): void {
        this.isEditingCart = false;
        this.printingCost = 0;
        this.startupFee = 0;
        this.extrasCost = 0;
        this.selectedQuantity = 1;
        this.previousQuantity = 1;
        this.selectedProcessId = null;
        this.selectedProcessIndex = null;

        this.printerSize = { ...this.printerSize };
        this.selectedItemId = file._id;
        this.files = file;

        setTimeout(() => {
            if (!isCartPanelOpen) {
                if (this.isYourOrderShow == true && this.isCustomiseModelShow == false && this.count != 0) {
                    this.isCustomiseModelShow = true;
                    this.isYourOrderShow = false;
                } else if (this.count == 0) {
                    this.onExpandOrder();
                    this.toggelCustomiseModel()
                }
            }
        }, 200);

        const cartItem = this.cartItems.find(item => item?.file._id == this.selectedItemId);
        if (cartItem) {
            this.selectedQuantity = cartItem.quantity;
            this.previousQuantity = cartItem.quantity;
            this.selectedProcessIndex = this.processList.findIndex(p => p._id === cartItem.processId);
            if (this.processList[this.selectedProcessIndex]) {
                this.selectedProcessId = this.processList[this.selectedProcessIndex]._id;
            }

            if (this.selectedProcessId) {
                this.getMaterialBasedOnProcess(this.processList[this.selectedProcessIndex]._id, cartItem.materialId);
            } else {
                this.materialList = [];
                this.finishesList = [];
                this.extrasList = [];
            }
            this.startupFee = this.calculateStartupFee(cartItem.materialId, this.selectedQuantity);
            this.extrasCost = this.calculateExtrasCost(cartItem.extras_ids, this.selectedQuantity);
        } else {
            this.selectedQuantity = 1;
        }
    }

    updateQuantity(): void {
        if (!this.selectedItemId) return;

        const currentQuantity = this.selectedQuantity;
        const cartItem = this.cartItems.find(item => item.file._id === this.selectedItemId);

        if (cartItem && currentQuantity > 0) {
            // Update the cart item quantity
            cartItem.quantity = currentQuantity;
            this.previousQuantity = currentQuantity;

            // Recalculate printing cost
            this.updateCosts();

            // Recalculate startup fee based on the new quantity
            this.startupFee = this.calculateStartupFee(cartItem.materialId, currentQuantity);

            // Recalculate extras cost based on the new quantity
            this.extrasCost = this.calculateExtrasCost(this.selectedExtras, currentQuantity);

            // Update subtotal with all the recalculated costs
            this.cartSubTotal = this.printingCost + this.startupFee + this.extrasCost;

            // Recalculate GST cost based on the updated subtotal
            this.cartGstCost = +(this.cartSubTotal * 0.10).toFixed(2);

            // Update total cost
            this.cartTotatCost = this.cartSubTotal + this.cartGstCost;
        }
    }

    // Helper method to get cost per part
    getCostPerPart(type: 'printing' | 'postProduction'): number {
        if (type === 'printing') {
            return +(this.printingCost / this.previousQuantity).toFixed(2); // Cost per part for printing
        }
        return 0;
    }

    removeModel(itemId: string) {
        const cartIndex = this.cartItems.findIndex(item => item.file._id === itemId);
        if (cartIndex >= 0) {
            this._quotationService.removeModelFromRail(this.quotationId, itemId).subscribe((res) => {
                this._commonService.openSnackBar("Model has been removed successfully");
                this.filesList.splice(cartIndex, 1);
                this.getQuotation(true)
            }, (err) => {
                this._commonService.openErrorSnackBar(err.message);
            });
        }
    }
    removeModelFromCart(itemId: string): void {
        const itemIdx = this.cartItems.findIndex((ele) => ele._id === itemId)

        this.cartItems[itemIdx].is_cart = false;
        this.cartItems[itemIdx].price = null
        this.cartItems[itemIdx].quantity = 1

        const updateData = this.cartItems.map((element) => {
            const { file, processId, materialId, extras_ids, finishes_ids, ...otherDetails } = element;

            // Format extras_ids to be an array of objects with only `extras_id`
            const formattedExtras = extras_ids ? extras_ids.map(extra => ({ extras_id: extra })) : [];

            // Format finishes_ids to remove `_id` and keep only `finishes_id`
            const formattedFinishes = finishes_ids ? finishes_ids.map(finish => ({ finishes_id: finish.finishes_id })) : [];

            return {
                ...otherDetails,
                process_id: processId || null,
                material_id: materialId || null,
                extras_ids: formattedExtras,
                finishes_ids: formattedFinishes
            };
        });

        if (updateData.length > 0) {
            this._quotationService.updateQuotation(this.quotationId, { items: updateData }).subscribe((res) => {
                this._commonService.openSnackBar("Model has been removed successfully")
                this.filesList.splice(itemIdx, 0, this.cartItems[itemIdx].file);
                this.getQuotation(true);
                // this.cartItems[itemIdx].price = null
            }, (error) => {
                this._commonService.openErrorSnackBar(error.message)
            })
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

    getMaterialBasedOnProcess(id: string, forCart?: any, updateCostCalulate?: boolean) {
        this.shouldShowOnSaleBatch = false;
        this._quotationService.getMaterialFromProcessId(id).subscribe((result) => {
            console.log("getMaterialBasedOnProcess",result)
            if (result.statusCode === 200) {
                this.materialList = result?.data.result.materialsData;

                const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);

                if (forCart) {
                    // Find and set the selected material for the cart
                    this.selectedMaterial = this.materialList.find(m => m._id === forCart);
                    if (!this.selectedMaterial)
                        {
                            this.selectedMaterial = this.materialList[0];
                            selectedItem.materialId = this.materialList[0]._id;
                            selectedItem.order_value = Number(this.materialList[0].order_value.$numberDecimal);
                            selectedItem.finishes_ids = [];
                            selectedItem.extras_ids = [];
                        };
                    this.finishesList = this.selectedMaterial?.finishesData ? this.selectedMaterial?.finishesData : []; // Ensure finishes data is loaded correctly
                    this.extrasList = this.selectedMaterial?.extrasData ? this.selectedMaterial?.extrasData : [];

                    if (selectedItem) {
                        selectedItem.materialId = this.selectedMaterial?._id;
                        const selectedFinishId = selectedItem?.finishes_ids.length ? selectedItem?.finishes_ids[0].finishes_id : null;
                        this.selectedFinish = this.finishesList.find(f => f._id == selectedFinishId);
                        this.selectedExtras = selectedItem?.extras_ids.map(extra => extra);

                        if (!this.selectedFinish) {
                            this.selectedFinish = this.finishesList[0];
                            selectedItem.finishes_ids = [{ finishes_id: this.selectedFinish._id }];
                        }

                        this.startupFee = this.calculateStartupFee(this.selectedMaterial, this.selectedQuantity); // Calculate startup fee
                        this.updateCosts(); // Recalculate costs for the selected material
                    }
                } else {
                    this.selectedMaterial = this.materialList[0];
                    this.finishesList = this.selectedMaterial?.finishesData ? this.selectedMaterial?.finishesData : [];
                    this.extrasList = this.selectedMaterial?.extrasData ? this.selectedMaterial?.extrasData : [];
                    selectedItem.materialId = this.selectedMaterial?._id;
                    selectedItem.order_value = Number(this.materialList[0].order_value.$numberDecimal);
                    this.selectedFinish = this.finishesList[0];
                    selectedItem.finishes_ids = [{ finishes_id: this.selectedFinish._id }];

                    this.startupFee = this.calculateStartupFee(this.selectedMaterial, this.selectedQuantity);
                    this.updateCosts();
                }
            }

        }, (error: any) => {
            if (error.status === 401) {
                this._router.navigateByUrl('sign-in');
            }
            this.showError(error);
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

    getUploadedFile(filePath: string) {
        if (!filePath) return null;

        // Check if the URL is already cached
        if (this.cachedImageUrls.has(filePath)) {
            return this.cachedImageUrls.get(filePath) as SafeUrl;
        }

        const fileName = filePath.split('/').pop();
        const sanitizedUrl = this.sanitizer.bypassSecurityTrustUrl(this._fileManagementService.getFile("processImages", fileName));

        // Cache the URL
        this.cachedImageUrls.set(filePath, sanitizedUrl);

        return sanitizedUrl;
    }

    onProcessSelected(process: any, index: number): void {
        debugger
        if (!this.selectedItemId) {
            return this._commonService.openErrorSnackBar("Please select the file to customise");
        }

        if (process?.printersData[0]?.max_size_x && process.printersData[0]?.max_size_y && process?.printersData[0]?.max_size_z) {
            this.printerSize = { X: Number(process?.printersData[0]?.max_size_x), Y: Number(process.printersData[0]?.max_size_y), Z: Number(process?.printersData[0]?.max_size_z) };
        } else {
            this.printerSize = { X: 0, Y: 0, Z: 0 };
        }
        this.selectedProcessIndex = index;
        this.ensureCartItemExists();
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        if (selectedItem) {
            selectedItem.processId = process._id;
            selectedItem.instant_quote = process.instant_quote;
            selectedItem.require_review = process.require_review

            this.getMaterialBasedOnProcess(process._id, selectedItem.materialId);
            this.toggleProcessListSize();
            // this.updateCosts();
        }
        console.log("instant_quote",selectedItem)

    }

    get requireReview(): boolean {
        // console.log("xxxxxxxxxxxxxxxprocessList",this.processList)
        debugger
        const selectedProcess = this.processList[this.selectedProcessIndex !== -1 ? this.selectedProcessIndex : 0];
        return selectedProcess?.require_review || false;
      }

      
    async getProcessPrice(processId: string): Promise<number> {
        return new Promise((resolve) => {
            const process = this.processList.find(p => p._id === processId);
            let url = '';
            if (process) {
                url += `?equation_mapped_id=${process.pricingModelsData._id}&material_id=${this.selectedMaterial?._id}&finishes_id=${this.selectedFinish?._id}&process_id=${processId}`
                if (this.volumeData) {
                    if (this.volumeData) {
                        url += `&x=${this.volumeData.coordinates.x}&y=${this.volumeData.coordinates.y}&z=${this.volumeData.coordinates.z}&surface_area=${this.volumeData.surfaceArea}&volume=${this.volumeData.volume}&quantity=${this.selectedQuantity}`;
                    }
                }
                this._quotationService.calculateProcessPrice(url).subscribe((result) => {
                    resolve(result?.data?.finalPrice || 0);
                }, () => {
                    resolve(0);
                });
            } else {
                resolve(0);
            }
        });
    }


    onMaterialChange(event: any): void {
        if (!this.selectedItemId) {
            return this._commonService.openErrorSnackBar("Please select the file to customise");
        }
        this.ensureCartItemExists();
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        if (selectedItem) {
            const material = this.materialList.find((mat) => mat._id === event._id);
            if (material) {
                // Set selected material
                this.selectedMaterial = material;
                selectedItem.materialId = material._id;
                selectedItem.order_value = Number(material.order_value.$numberDecimal);

                // Reset selected finish and extras when material changes
                this.selectedFinish = null;
                this.selectedExtras = [];
                selectedItem.extras_ids = []; // Reset extras in the cart item as well

                // Update finishes and extras lists based on the new material
                this.finishesList = material?.finishesData ? material.finishesData : [];
                this.extrasList = material?.extrasData ? material?.extrasData : [];

                this.selectedFinish = this.finishesList.length ? this.finishesList[0] : null;

                // Recalculate startup fee and update all costs
                this.startupFee = this.calculateStartupFee(material, this.selectedQuantity);
                this.extrasCost = 0; // Reset extras cost since extras are cleared
                this.updateCosts();  // Update all costs
            }
        }
    }


    onExtrasSelected(extra: any, isChecked: boolean): void {
        if (!this.selectedItemId) {
            return this._commonService.openErrorSnackBar("Please select the file to customise");
        }
        this.ensureCartItemExists();
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        if (!selectedItem) return;

        // Initialize extras_ids array if it does not exist
        if (!selectedItem.extras_ids) {
            selectedItem.extras_ids = [];
        }

        if (isChecked) {
            // Add the extra to the array if it is not already included
            if (!selectedItem.extras_ids.includes(extra._id)) {
                selectedItem.extras_ids.push(extra._id);
            }
        } else {
            // Remove the extra from the array if it is included
            const index = selectedItem.extras_ids.indexOf(extra._id);
            if (index > -1) {
                selectedItem.extras_ids.splice(index, 1);
            }
        }

        // Update the global selectedExtras to reflect the changes
        this.selectedExtras = selectedItem.extras_ids;

        // Calculate and update extras cost and total costs
        this.extrasCost = this.calculateExtrasCost(this.selectedExtras, this.selectedQuantity);
        this.updateCosts();
    }


    onFinishSelected(finish: any): void {
        if (!this.selectedItemId) {
            return this._commonService.openErrorSnackBar("Please select the file to customise");
        }
        this.ensureCartItemExists();
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        if (!selectedItem) return;
        selectedItem.finishes_ids = [{ finishes_id: finish._id }];
        const finishes = this.finishesList.find((fin) => fin._id == finish._id);
        this.selectedFinish = finishes;
        this.updateCosts();
    }

    onQuantityChange(quantity: number) {
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        if (selectedItem) {
            selectedItem.quantity = quantity;
            this.updateCosts();
        }
    }


    get cartItemsInCart(): CartItem[] {
        return this.cartItems.filter(item => item.is_cart);
    }

    getSpecFile(filePath: any) {
        const serverFileName = filePath.split('/').pop();
        return this._fileManagementService.getFile("specFiles", serverFileName);
    }

    get3dFile(filePath: any) {
        const serverFileName = filePath.split('/').pop();
        return this._fileManagementService.getFile("3dFiles", serverFileName);
    }

    isFinishSelected(finishId: any): boolean {
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        return selectedItem ? selectedItem.finishes_ids.some(ele => ele.finishes_id === finishId._id) : false;
    }

    ensureCartItemExists(): void {
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        console.log("this.cartItems",this.cartItems)
        if (!selectedItem) {
            this.cartItems.push({
                file: this.filesList.find(file => file._id === this.selectedItemId),
                processId: '',
                materialId: '',
                finishes_ids: [],
                extras_ids: [],
                quantity: 1,
                is_cart: false,
                price: null,
                model: this.filesList.find(file => file._id === this.selectedItemId)?.url,
                position: { x: '0', y: '0', z: '0' },
                volume: '0',
                surface_area: '0',
                errors: null,
                instant_quote:false,
                require_review:false,
                order_value:0,
                applied_proccess_dicount:0,
                thumbnail:''
            });
        }
    }

    validateSelections(): boolean {
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        if (!selectedItem) return false;

        const validationMessages: string[] = [];

        if (!selectedItem.processId) {
            validationMessages.push('Please select a process.');
        }

        if (!selectedItem.materialId) {
            validationMessages.push('Please select a material.');
        }

        if (!selectedItem.finishes_ids.length) {
            validationMessages.push('Please select a finish.');
        }

        if (selectedItem.quantity <= 0) {
            validationMessages.push('Quantity must be greater than zero.');
        }

        const totalQuantity = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);

        if (totalQuantity + selectedItem.quantity > 1000) {
            validationMessages.push('Total quantity in the cart cannot exceed 1000.');
        }

        if (validationMessages.length > 0) {
            this.showError({ error: { message: validationMessages.join('\n') } });
            return false;
        }

        return true;
    }

    save() {
        if (this.isEditingCart) {
            this.updateCart();
        } else {
            this.addModelToCart();
        }
    }


    updateCart() {
        if (!this.selectedItemId) {
            this.showError({ error: { message: 'No model is selected. Please select a model before adding to cart.' } });
            return;
        }
        const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
        if (selectedItem) {
            selectedItem.is_cart = true;
            selectedItem.price = this.subTotal;
            selectedItem.position.x = String(this.volumeData.coordinates.x);
            selectedItem.position.y = String(this.volumeData.coordinates.y);
            selectedItem.position.z = String(this.volumeData.coordinates.z);
            selectedItem.volume = String(this.volumeData.volume)
            selectedItem.surface_area = String(this.volumeData.surfaceArea);
            selectedItem.errors = this.convertErrorsToFormat(this.volumeData.errors);
            const formattedExtras = this.selectedExtras.map(extraId => ({ extras_id: extraId }));
            selectedItem.extras_ids = formattedExtras;
           (selectedItem as any).process_id = selectedItem.processId;
            (selectedItem as any).material_id = selectedItem.materialId;
            (selectedItem as any).applied_proccess_dicount = this.totalDiscount;
            delete (selectedItem as any).extrasData;
            delete (selectedItem as any).finishesData;
            delete (selectedItem as any).materialData;
            delete (selectedItem as any).processData;
            delete (selectedItem as any).processId;
             delete (selectedItem as any).materialId;

            this._quotationService.updateModelInCart(this.quotationId, selectedItem._id, selectedItem).subscribe((result) => {
                this.getQuotation(true);
                this.isCustomiseModelShow = false;
                this.isYourOrderShow = true
                this.resetSelections();
            }, (error) => {
                this._commonService.openErrorSnackBar(error.message);
            });

        }
    }


    addModelToCart(): void {
        if (!this.selectedItemId) {
            this.showError({ error: { message: 'No model is selected. Please select a model before adding to cart.' } });
            return;
        }

        if (this.validateSelections()) {
            this.ensureCartItemExists();
            const selectedItem = this.cartItems.find(item => item.file._id === this.selectedItemId);
            if (selectedItem) {
                selectedItem.is_cart = true;
                selectedItem.price = this.subTotal;
                selectedItem.position.x = String(this.volumeData.coordinates.x);
                selectedItem.position.y = String(this.volumeData.coordinates.y);
                selectedItem.position.z = String(this.volumeData.coordinates.z);
                selectedItem.volume = String(this.volumeData.volume)
                selectedItem.surface_area = String(this.volumeData.surfaceArea);
                selectedItem.errors = this.convertErrorsToFormat(this.volumeData.errors);

                const updateData = this.cartItems.map((element) => {
                    const { file, processId, materialId, extras_ids, finishes_ids, ...otherDetails } = element;

                    // Format extras_ids to be an array of objects with only `extras_id`
                    const formattedExtras = extras_ids ? extras_ids.map(extra => ({ extras_id: extra })) : [];

                    // Format finishes_ids to remove `_id` and keep only `finishes_id`
                    const formattedFinishes = finishes_ids ? finishes_ids.map(finish => ({ finishes_id: finish.finishes_id })) : [];

                    return {
                        ...otherDetails,
                        process_id: processId || null,
                        material_id: materialId || null,
                        extras_ids: formattedExtras,
                        finishes_ids: formattedFinishes
                    };
                });

                if (updateData.length > 0) {
                    this._quotationService.updateQuotation(this.quotationId, { items: updateData }).subscribe((res) => {
                        this._commonService.openSnackBar("Model added in cart successfully");
                        this.filesList = this.filesList.filter(file => file._id !== this.selectedItemId);
                        this.resetSelections();
                        if (!this.filesList.length) {
                            this.completeForm();
                            this.selectedItemId = null;
                        } else {
                            this.getQuotation(true);
                            this.isCustomiseModelShow = false;
                            this.isYourOrderShow = true;
                        }
                    }, (error) => {
                        this._commonService.openErrorSnackBar(error.message);
                    });
                }
            }
        }
    }

    onSaveAndExit() {
        debugger
        this.stepService.setStepCompleted(1, true);
        const amountDetails = {
            "subtotal": this.cartSubTotal,
            "tax": this.cartGstCost,
            "discount": 0,
            "total": this.cartTotatCost,
            "currency": "USD",
        }
        console.log(this.cartTotatCost,"this.quotationId", QuotationStatus.SaveAndExitCart,"this.quotationId", amountDetails);
        return
        this._quotationService.updateQuotation(this.quotationId, { amount_details: amountDetails, total_amount: this.cartTotatCost, quotation_status: QuotationStatus.SaveAndExitCart, }).subscribe((res) => {
            this._commonService.openSnackBar("Cart details saved successfully")
            this.stepService.resetSteps();
                this._router.navigate(["/upload-models"])
        })
     }

    resetSelections(): void {
        this.selectedMaterial = null;
        this.selectedProcessId = null;
        this.selectedProcessIndex = null;
        this.selectedFinish = null;
        this.selectedExtras = [];
        this.printingCost = 0;
        this.startupFee = 0;
        this.extrasCost = 0;
        this.selectedItemId = null;
        this.files = null;
        this.isEditingCart = false;
    }


    updateXYXPosition(event: VolumeData) {
        this.volumeData = event;
    }

    convertErrorsToFormat = (errors: string[]) => {
        return errors.map(error => ({ error }))
    };

    toggleProcessListSize(){
        this.showAllProcess = !this.showAllProcess;
        // processBlock.scrollTop = 0;
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
    instant_quote:boolean,
    require_review:boolean,
    order_value:number,
    applied_proccess_dicount:number,
    thumbnail?:string
}
