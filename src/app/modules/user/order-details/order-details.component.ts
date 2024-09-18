import { Status } from './../project-wizard/add-edit-project-wizard/add-edit-project-wizard.component';
import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StepService } from 'app/core/services/step.service';
import { ReactiveFormsModule, FormsModule, Validators, FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseCardComponent } from '@fuse/components/card';
import { UserService } from 'app/core/user/user.service';
import { map, Observable, startWith } from 'rxjs';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuotationService } from 'app/core/services/quotation.service';
import { CommonService } from 'app/core/common/common.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { QuotationStatus } from 'app/core/models/quotation-status.enum';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FileManagementService } from 'app/core/services/file-management.service';
import { ProjectService } from 'app/core/services/project.service';
import { MatDatepickerModule } from '@angular/material/datepicker';


@Component({
    selector: 'app-order-details',
    standalone: true,
    imports: [CommonModule, CdkScrollable, ReactiveFormsModule, MatProgressSpinnerModule, MatDatepickerModule, MatCheckboxModule, MatRadioModule, FormsModule, MatTableModule, NgIf, MatExpansionModule, MatButtonModule, RouterLink, MatIconModule, MatMenuModule, MatSlideToggleModule, FuseCardComponent, MatTooltipModule, MatFormFieldModule, MatOptionModule, MatAutocompleteModule, MatSelectModule, MatInputModule, MatSnackBarModule],
    templateUrl: './order-details.component.html',
    styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent {

    formCompleted: boolean = false;
    isOpen: boolean = true;
    isBillingContactSame: boolean = false;
    quotationId: string
    quotation: any;
    cartItems: any[] = []
    models = [];
    countryList: any[] = [];
    filteredOptions: Observable<any[]>;
    countryBillingFilterOption: Observable<any[]>;
    localPickup: boolean = false;
    isBillingAddressSame: boolean = false;

    promotionCodeFormControl = new FormControl('', [Validators.required]);
    localPickupForm: FormGroup;
    contactForm: FormGroup;
    billingContactForm: FormGroup;
    billingAddressForm: FormGroup;
    projectForm: FormGroup;
    loggedInUserData: LoogedUserData;
    discountCost: number = 0;
    gstCost: number = 0;
    promotionCost: number = 0;
    deliveryFee: number = 45;

    documents: { document_name: string; document_type: string; document_link: string }[] = [];
    selectedFiles: File[] = [];
    notes: string = '';
    projectList: any[] = [];
    isNewProject: boolean = false;
    isPromotionCodeInvalid: boolean = false;
    isPromotionApplied: boolean = false;
    promotionId: string;
    isOrderValueMatch: boolean = true;
    isProcessInstantQuote: boolean = true;
    isAllfieldDisabled: boolean = false;
    isMtericOrFitSizeError: boolean = false;

    constructor(private router: Router, private stepService: StepService, private fb: FormBuilder,
        private _userService: UserService, private _quotationService: QuotationService, private _commonService: CommonService,
        private _fuseConfirmationService: FuseConfirmationService, private _fileManagementService: FileManagementService,
        private _projectService: ProjectService) { }

    ngOnInit(): void {
        this.quotationId = this._quotationService.getQuotationId();
        if (!this.quotationId) {
            this.router.navigate(['/upload-models'])
        }
        this.getQutotation()
        this.getProjectList();
        this.getLoggedInUserData();
        this.getCountryData();

        this.contactForm = this.fb.group({
            first_name: ['', [Validators.required, Validators.minLength(2)]],
            last_name: ['', [Validators.required, Validators.minLength(2)]],
            phone_number: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
            email: ['', [Validators.required, Validators.email]],
            additional_email: ['']
        });

        this.billingContactForm = this.fb.group({
            company_name: [''],
            first_name: [{ value: '', disabled: this.isBillingContactSame }, [Validators.required, Validators.minLength(2)]],
            last_name: [{ value: '', disabled: this.isBillingContactSame }, [Validators.required, Validators.minLength(2)]],
            phone_number: [{ value: '', disabled: this.isBillingContactSame }, [Validators.required, Validators.pattern('^[0-9]+$')]],
            email: [{ value: '', disabled: this.isBillingContactSame }, [Validators.required, Validators.email]],
        });

        this.localPickupForm = this.fb.group({
            company_name: [''],
            street_1: [{ value: '', disabled: this.isBillingAddressSame }, Validators.required],
            street_2: [{ value: '', disabled: this.isBillingAddressSame }],
            city: [{ value: '', disabled: this.isBillingAddressSame }, Validators.required],
            pincode: [{ value: '', disabled: this.isBillingAddressSame }, [Validators.required, Validators.pattern('^[0-9]+$')]],
            country: [{ value: '', disabled: this.isBillingAddressSame }, Validators.required],
            shipping_method: ['RoadExpress', Validators.required],
            delivery_type: ['ShipToAddress', Validators.required],

        });

        this.billingAddressForm = this.fb.group({
            street_1: ['', Validators.required],
            street_2: [''],
            city: ['', Validators.required],
            pincode: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
            country: ['', Validators.required]
        });

        this.projectForm = this.fb.group({
            project_id: [''],
            name: [''],
            start_date: ['']
        });

        this.filteredOptions = this.localPickupForm.get('country').valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value || '')),
        );

        this.countryBillingFilterOption = this.billingAddressForm.get('country').valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value || '')),
        );

        this.localPickupForm.get('shipping_method')?.valueChanges.subscribe((method) => {
            this.updateDeliveryFee(method);
        });

        this.localPickupForm.get('delivery_type')?.valueChanges.subscribe((deliveryType) => {
            this.toggleLocalPickupValidation(deliveryType);
        });

    }


    get totalQuantity() {
        return this.models.reduce((sum, item) => sum + item.quantity, 0)
    }

    get partsTotalCost() {
        return this.models.reduce((sum, item) => sum + item.price, 0)
    }

    get subTotalCost() {
        const discountApplied = this.promotionCost;
        return Math.max(0, (this.partsTotalCost - discountApplied) + this.deliveryFee);
    }

    get totalCost() {
        this.gstCost = +((this.subTotalCost * 10) / 100).toFixed(2);
        return this.subTotalCost + this.gstCost;
    }

    get processAppliedCost() {
        return this.models.reduce((sum, item) => sum + (item.applied_proccess_dicount) * item.quantity, 0)
    }


    completeForm() {
        this.formCompleted = true;
        this.stepService.setStepCompleted(2, true);
        this.router.navigate(['/confirmation']);
    }

    toggleAccordion() {
        this.isOpen = !this.isOpen;
    }

    getLoggedInUserData() {
        this._userService.getLoggedUserData().subscribe((result: any) => {
            this.loggedInUserData = result.data.result as LoogedUserData;
            this.contactForm.patchValue(this.loggedInUserData);
            this.contactForm.patchValue({
                phone_number: this.loggedInUserData.phone
            })
            Object.keys(this.contactForm.controls).forEach(controlName => {
                const control = this.contactForm.get(controlName);
                if (control?.value && controlName !== 'additional_email') {
                    control.disable();
                }
            });
        })
    }

    getProjectList() {
        this._projectService.getAllProject('?skip_pagination=true').subscribe((result) => {
            this.projectList = result.data.result;
        })
    }

    onNewProject() {
        this.isNewProject = true;
        this.projectForm.controls['name'].setValidators(Validators.required);
        this.projectForm.controls['start_date'].setValidators(Validators.required);
        this.projectForm.controls['name'].updateValueAndValidity();
        this.projectForm.controls['start_date'].updateValueAndValidity();
    }

    resetNewProjectFields() {
        this.projectForm.controls['name'].clearValidators();
        this.projectForm.controls['start_date'].clearValidators();
        this.projectForm.controls['name'].updateValueAndValidity();
        this.projectForm.controls['start_date'].updateValueAndValidity();
        this.projectForm.patchValue({ name: '', start_date: '' });
    }

    saveNewProject() {
        if (this.projectForm.controls['name'].invalid || this.projectForm.controls['start_date'].invalid) {
            return;
        }

        const newProjectData = {
            name: this.projectForm.get('name')?.value,
            start_date: this.projectForm.get('start_date')?.value
        };

        this._projectService.addProject(newProjectData).subscribe((response) => {
            this.getProjectList();
            this.isNewProject = false;
            this.resetNewProjectFields();
        });
    }

    selectedCountry(e: any) {
        // this.localPickupForm.patchValue({
        //     country: this.countryList.find( c => c.name === e.option.value).dial_code
        // })
    }

    selectCountryBilling(e: any) {

    }

    getCountryData() {
        this._userService.getCountries().subscribe((res: any) => {
            this.countryList = res;
        })
    }

    onBillingContatChange(event: MatCheckboxChange) {
        this.isBillingContactSame = event.checked;
        this.toggleBillingContact();
        if (this.isBillingContactSame)
            this.copyContactForm();

    }

    onBillingAddressChange(event: MatCheckboxChange) {
        this.isBillingAddressSame = event.checked;
        this.toggleBillingAddress();
        if (this.isBillingAddressSame) this.copyDeliveryForm();
    }

    copyContactForm() {
        this.billingContactForm.patchValue(this.contactForm.getRawValue());
    }

    copyDeliveryForm() {
        this.billingAddressForm.patchValue(this.localPickupForm.value);
    }

    toggleBillingContact(): void {
        if (this.isBillingContactSame) {
            this.billingContactForm.get('first_name').disable();
            this.billingContactForm.get('last_name').disable();
            this.billingContactForm.get('phone_number').disable();
            this.billingContactForm.get('email').disable();
        } else {
            this.billingContactForm.get('first_name').enable();
            this.billingContactForm.get('last_name').enable();
            this.billingContactForm.get('phone_number').enable();
            this.billingContactForm.get('email').enable();
        }
    }

    toggleBillingAddress(): void {
        if (this.isBillingAddressSame && !this.localPickup) {
            this.billingAddressForm.get('street_1').disable();
            this.billingAddressForm.get('street_2').disable();
            this.billingAddressForm.get('city').disable();
            this.billingAddressForm.get('pincode').disable();
            this.billingAddressForm.get('country').disable();
        } else {
            this.billingAddressForm.get('street_1').enable();
            this.billingAddressForm.get('street_2').enable();
            this.billingAddressForm.get('pincode').enable();
            this.billingAddressForm.get('city').enable();
            this.billingAddressForm.get('country').enable();

        }

        if (this.localPickup) {
            this.localPickupForm.get('delivery_type').setValue("LocalPickup");
        } else {
            this.localPickupForm.get('delivery_type').setValue("ShipToAddress");
        }
    }

    toggleLocalPickupValidation(deliveryType: string) {
        if (deliveryType === 'LocalPickup') {
            this.localPickupForm.get('street_1')?.clearValidators();
            this.localPickupForm.get('city')?.clearValidators();
            this.localPickupForm.get('pincode')?.clearValidators();
            this.localPickupForm.get('country')?.clearValidators();
        } else {
            this.localPickupForm.get('street_1')?.setValidators(Validators.required);
            this.localPickupForm.get('city')?.setValidators(Validators.required);
            this.localPickupForm.get('pincode')?.setValidators([Validators.required, Validators.pattern('^[0-9]+$')]);
            this.localPickupForm.get('country')?.setValidators(Validators.required);
        }

        // Update the form control validity
        this.localPickupForm.get('street_1')?.updateValueAndValidity();
        this.localPickupForm.get('city')?.updateValueAndValidity();
        this.localPickupForm.get('pincode')?.updateValueAndValidity();
        this.localPickupForm.get('country')?.updateValueAndValidity();
    }

    keyUp(model) {
        if (this.isAllfieldDisabled) return;
        const perPartCost = +(model.price / model.quantity).toFixed(2)
        model.quantity++;
        model.price += perPartCost
        this.updateCartItems(model);
    }

    keyDown(model) {
        if (this.isAllfieldDisabled) return;
        if (model.quantity == 1) return;
        const perPartCost = +(model.price / model.quantity).toFixed(2)
        model.quantity--;
        model.price -= perPartCost;
        this.updateCartItems(model);
    }

    toggleDieliveryType(value: boolean) {
        if (this.isAllfieldDisabled) return;
        this.localPickup = value;
    }


    private _filter(value: string): string[] {
        const filterValue = value.toLowerCase();

        return this.countryList.filter(option => option.name.toLowerCase().includes(filterValue));
    }



    getModelName(url: string) {
        return url.split('/').pop();
    }

    //   Qutotaion API call
    private getQutotation() {
        this._quotationService.getQuotationById(this.quotationId).subscribe((res) => {
            this.quotation = res.data.result;
            this.cartItems = res.data.result.items;

            this.models = this.cartItems.reduce((acc, item) => {
                if (item.is_cart) {
                    acc.push(item);
                }
                return acc;
            }, []);

            console.log("this.models", this.models)

            const materialTotals: { [key: string]: number } = {};

            // Calculate the total price for each materialId
            this.models.forEach((model) => {
                const totalPrice = model.price;

                if (!materialTotals[model.materialId]) {
                    materialTotals[model.materialId] = 0;
                }
                materialTotals[model.materialId] += totalPrice;
            });

            this.models.forEach((model) => {
                // Check if the summed total for this model's materialId is less than order_value
                if (materialTotals[model.materialId] < model.order_value) {
                    this.isOrderValueMatch = false;
                } else {
                    this.isOrderValueMatch = true;
                }

                // Check for instant quote
                if (model.instant_quote === false) {
                    this.isProcessInstantQuote = false; // If any model has instant_quote as false
                }

                // Set require_review
                model.require_review = model.require_review === true;

                // Check for metrics errors or model fit issues
                if (model.is_metrics_error === true || model.model_is_fit === false) {
                    this.isMtericOrFitSizeError = true;
                }
            });

            this.isProcessInstantQuote = !this.models.some(model => model.instant_quote === false);

            console.log("this.models111", this.models)
            if (res.data.result.project_id) {
                this.projectForm.get('project_id').setValue(res.data.result.project_id);
            }

            if (!this.models.length) {
                this._commonService.openErrorSnackBar("Please add items to cart")
                this.stepService.setStepCompleted(1, false)
                return this.router.navigate(["/create-order"])
            }

            // local pickup set while fetch data if not selected.
            if (res?.data?.result?.delivery_details?.delivery_type === "LocalPickup") {
                this.localPickup = true;
                this.updateDeliveryFee('LocalPickUp');
            }

            this.contactForm.patchValue(res.data.result.contact_details || {});
            this.billingContactForm.patchValue(res.data.result.billing_contact_details || {});
            this.localPickupForm.patchValue(res.data.result.delivery_details || {});
            this.billingAddressForm.patchValue(res.data.result.shipping_details || {});

            // Refill notes
            this.notes = res.data.result.notes || '';

            // Refill documents
            this.documents = res.data.result.documents || [];

            if (res.data.result.quotation_status == QuotationStatus.InReview || res.data.result.quotation_status == QuotationStatus.FinaliseQuote) {
                this.isAllfieldDisabled = true;
                this.contactForm.disable();
                this.billingContactForm.disable();
                this.localPickupForm.disable();
                this.billingAddressForm.disable();
                this.projectForm.disable();
                if (res.data.result.promotion_details.promotion_id) {
                    this.promotionCodeFormControl.setValue(res.data.result?.promotionsData?.name);
                    this.onValidatePromo();
                }
            }

        })
    }

    updateCartItems(model) {
        this._quotationService.updateModelInCart(this.quotationId, model._id, model).subscribe((res) => {
            if (res?.statusCode == 200) {
                this.getQutotation();
            }
        }, (error: any) => {
            this.showError(error);
        });
    }


    public removeItem(itemId: string) {
        const idx = this.cartItems.findIndex((item) => item._id === itemId)
        if (idx !== -1) {
            this.cartItems[idx].is_cart = false
            this._quotationService.updateQuotation(this.quotationId, { items: this.cartItems }).subscribe((res) => {
                const idx = this.models.findIndex((item) => item._id == itemId)
                this.models.splice(idx, 1)
                this._commonService.openSnackBar("Items removed successfully")
                if (!this.models.length) {
                    this._commonService.openErrorSnackBar("Please add items to cart")
                    this.stepService.setStepCompleted(1, false)
                    return this.router.navigate(["/create-order"])
                }
            }, (error) => {
                this._commonService.openErrorSnackBar(error.message)
            })
        }
    }

    updateDeliveryFee(method: string) {
        if (method === 'Standard') {
            this.deliveryFee = 35;
        } else if (method === 'RoadExpress') {
            this.deliveryFee = 45;
        } else {
            this.deliveryFee = 0;
        }
    }

    updateDeliveryMethod() {
        const method = this.localPickupForm.get('shipping_method').value;
        this.updateDeliveryFee(method);
    }

    onFileSelected(event: any) {
        const files = event.target.files;
        if (files.length > 0) {
            this.selectedFiles = Array.from(files);
            this.uploadFiles();
        }
    }

    uploadFiles() {
        const formData = new FormData();
        this.selectedFiles.forEach((file) => {
            formData.append('file', file);
        });

        this._fileManagementService.uploadMultipleFiles("notes", formData).subscribe(
            (response) => {
                const doc = response.data.files.map((link) => {
                    return {
                        document_name: link.filename || '',
                        document_type: link.filename?.split('.').pop() || '',
                        document_link: link.filepath,
                    };
                });
                doc.map((d) => this.documents.push(d));
            },
            (error) => {
                this._commonService.openErrorSnackBar(error.message);
            }
        );
    }

    getNoteFile(filePath: any) {
        const serverFileName = filePath.split('/').pop();
        return this._fileManagementService.getFile("notes", serverFileName);
    }

    openDocument(link: string) {
        window.open(this.getNoteFile(link), '_blank');
    }

    removeDocument(index: number) {
        this.documents.splice(index, 1);
    }

    onValidatePromo() {
        if (!this.promotionCodeFormControl.value) {
            this._commonService.openErrorSnackBar("Please enter promotion code!");
            return;
        }

        // Call the validate promotion code API
        this._quotationService.validatPromoCode(this.promotionCodeFormControl.value).subscribe((result) => {
            if (result.statusCode === 200) {
                const promotionData = result.data;
                const currentDate = new Date();
                let totalDiscount = 0;

                // Extract start and end dates
                const startDate = promotionData.limit.start_date ? new Date(promotionData.limit.start_date) : null;
                const endDate = promotionData.limit.end_date ? new Date(promotionData.limit.end_date) : null;

                // Check if the promotion is active and within the date range
                if (
                    promotionData.is_active && promotionData.used_count < promotionData.limit.usage &&
                    (
                        // Case 1: Both start and end dates are provided
                        (startDate && endDate && startDate <= currentDate && endDate >= currentDate) ||
                        // Case 2: Only start date is provided
                        (startDate && !endDate && startDate <= currentDate) ||
                        // Case 3: Only end date is provided
                        (!startDate && endDate && endDate >= currentDate) ||
                        // Case 4: No start or end dates are provided
                        (!startDate && !endDate)
                    )
                ) {
                    const { method, dollar, percentage } = promotionData.discount;
                    const qualifiers = promotionData.qualifiers;

                    // Check if no specific processes are listed in qualifiers
                    if (!qualifiers.processes || qualifiers.processes.length === 0) {
                        // Apply discount to all models
                        this.models.forEach(model => {
                            if (method === 1) {
                                // Fixed dollar discount
                                totalDiscount += dollar * model.quantity;
                            } else if (method === 2) {
                                // Percentage discount
                                totalDiscount += (model.price * percentage) / 100;
                            }
                        });
                    } else {
                        // Apply discount only to models with matching processId in qualifiers
                        this.models.forEach(model => {
                            const matchingProcess = qualifiers.processes.find(p => p.processId === model.process_id);
                            if (matchingProcess) {
                                if (method === 1) {
                                    // Fixed dollar discount
                                    totalDiscount += dollar * model.quantity;
                                } else if (method === 2) {
                                    // Percentage discount
                                    totalDiscount += (model.price * percentage) / 100;
                                }
                            }
                        });
                    }

                    this.promotionId = result.data._id;
                    this.promotionCost = totalDiscount;
                    this.isPromotionApplied = true;
                    this.isPromotionCodeInvalid = false;
                    this.promotionCodeFormControl.disable();
                } else {
                    // Promotion is not active or outside the date range
                    this._commonService.openErrorSnackBar("Promotion code is not valid.");
                    this.isPromotionCodeInvalid = true;
                }
            } else {
                this._commonService.openErrorSnackBar("Invalid promotion code.");
                this.isPromotionCodeInvalid = true;
            }
        });
    }

    onDeletePromo() {
        // Clear the promotion-related values
        this.promotionId = null;
        this.promotionCodeFormControl.reset(); // Clear the input field
        this.promotionCodeFormControl.enable(); // Enable the input field
        this.promotionCost = 0; // Reset the promotion cost
        this.isPromotionApplied = false; // Reset the promotion applied flag
        this.isPromotionCodeInvalid = false; // Reset invalid flag
    }


    onSaveAndExit() {
        let status: QuotationStatus;
        if (this.quotation.quotation_status == QuotationStatus.InReview || this.quotation.quotation_status == QuotationStatus.FinaliseQuote) {
            status = this.quotation.quotation_status;
        } else {
            status = QuotationStatus.SaveAndExitQuote;
        }

        this._quotationService.updateQuotation(this.quotationId, this.convertToQuotation(status)).subscribe((res) => {
            this._commonService.openSnackBar("Additional details saved successfully")
            this.stepService.resetSteps();
            this.router.navigate(["/upload-models"])
        })
    }



    submit() {
        if (!this.validateAllForms()) {
            return;
        }

        if (this.isAllfieldDisabled) {
            if (this.quotation.quotation_status == QuotationStatus.FinaliseQuote) {
                this.completeForm();
                return;
            }
            return;
        }

        let status: QuotationStatus;
        if ( !this.isProcessInstantQuote || this.isMtericOrFitSizeError) {
            status = QuotationStatus.InReview;
        } else {
            status = QuotationStatus.FinaliseQuote;
        }

        this._quotationService.updateQuotation(this.quotationId, this.convertToQuotation(status)).subscribe((result) => {
            if (result.statusCode === 200) {
                if (!this.isOrderValueMatch || !this.isProcessInstantQuote) {
                    this._commonService.openSnackBar("Quote requested successfully");
                    // this.getQutotation();
                    this.completeForm();

                } else {
                    this._commonService.openSnackBar("Quote created successfully");
                    this.completeForm();
                }
            }
        });
    }

    convertToQuotation(status: QuotationStatus) {

        if (status == QuotationStatus.SaveAndExitQuote) {
            this.onDeletePromo();
        }

        const deliveryType = this.localPickupForm.get('delivery_type')?.value;
        const deliveryDetails = deliveryType === "LocalPickup" ? {
            delivery_type: deliveryType
        } : {
            ...this.localPickupForm.getRawValue(),
        };
        const quotationObject = {
            contact_details: {
                additional_email: this.contactForm.get('additional_email')?.value,
            },
            shipping_details: this.billingAddressForm.getRawValue(),
            delivery_details: deliveryDetails,
            billing_contact_details: this.billingContactForm.getRawValue(),
            items: this.cartItems,
            quotation_status: status,
            total_amount: this.totalCost.toString(),
            amount_details: {
                subtotal: this.subTotalCost,
                tax: this.gstCost,
                discount: this.promotionCost,
                total: this.totalCost,
                currency: "AUS",
                payment_method: "Cash",
            },
            documents: this.documents,
            notes: this.notes,
            project_id: this.projectForm.get('project_id')?.value ? this.projectForm.get('project_id')?.value : null,
            promotion_details: {
                promotion_id: this.promotionId,
                promotion_cost: this.promotionCost
            }
        };

        return quotationObject
    }

    validateAllForms(): boolean {
        if (this.models.length == 0) {
            this._commonService.openErrorSnackBar('Please add models in cart.');
            return;
        }

        if (
            this.contactForm.invalid ||
            this.billingContactForm.invalid ||
            this.localPickupForm.invalid ||
            this.billingAddressForm.invalid || this.projectForm.invalid
        ) {
            this.contactForm.markAllAsTouched();
            this.billingContactForm.markAllAsTouched();
            this.localPickupForm.markAllAsTouched();
            this.billingAddressForm.markAllAsTouched();
            this.projectForm.markAllAsTouched();
            this._commonService.openErrorSnackBar('Please fill out all required fields correctly.');
            return false;
        }
        return true;
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

export interface LoogedUserData {
    _id: string
    country: string;
    countryCode: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    roleId: string;
}
