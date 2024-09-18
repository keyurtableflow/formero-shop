import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { ReactiveFormsModule, FormsModule, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { StepService } from 'app/core/services/step.service';
import { QuotationService } from 'app/core/services/quotation.service';
import { CommonService } from 'app/core/common/common.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from 'app/core/user/user.service';
import { LoogedUserData } from '../order-details/order-details.component';
import { FileManagementService } from 'app/core/services/file-management.service';
import { ProjectService } from 'app/core/services/project.service';
import _ from 'lodash';
import { QuotationStatus } from 'app/core/models/quotation-status.enum';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, CdkScrollable, ReactiveFormsModule, MatProgressSpinnerModule,MatDatepickerModule, MatCheckboxModule, MatRadioModule, FormsModule, MatTableModule, NgIf, MatExpansionModule, MatButtonModule, RouterLink, MatIconModule, MatMenuModule, MatSlideToggleModule, FuseCardComponent, MatTooltipModule, MatFormFieldModule, MatOptionModule, MatAutocompleteModule, MatSelectModule, MatInputModule, MatSnackBarModule],

  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent {
    currentState:string = "Review";
    quotationId: string
    quotation:any;
    cartItems:any[] =[];
    models = [];
    loggedInUserData:LoogedUserData;
    gstCost:number = 0;
    promotionCost:number =0;
    deliveryFee:number = 0;
    projectList:any[] = [];
    projectForm :FormGroup;
    documents: { document_name: string; document_type: string; document_link: string }[] = [];
    isDocumentDisabled:boolean = true;
    notes : string ='';
    selectedFiles: File[] = [];
    isNewProject:boolean = false;
    isQuotable:boolean = true;
    isProcessInstantQuote:boolean = true;
    isOrderValueMatch:boolean = true;



    constructor(private router: Router, private stepService: StepService,private _quotationService: QuotationService,
        private _commonService: CommonService,private _userService : UserService, private _fileManagementService:FileManagementService,
        private _projectService:ProjectService,private fb: FormBuilder,
    ){}

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
      return this.subTotalCost + this.gstCost ;
    }

    get processAppliedCost() {
        return this.models.reduce((sum, item) => sum + (item.applied_proccess_dicount)*item.quantity, 0)
      }


    ngOnInit(): void {
        this.quotationId = this._quotationService.getQuotationId();
        if (!this.quotationId) {
          this.router.navigate(['/upload-models'])
        }
        this.getQutotation();
        this.getLoggedInUserData();
        this.getProjectList();
        this.projectForm =  this.fb.group({
            project_id: ['', Validators.required],
            name: [''],
            start_date :['']
          });


    }

    private getQutotation() {
        this._quotationService.getQuotationById(this.quotationId).subscribe((res) => {
            this.quotation = res.data.result;
          this.cartItems = res.data.result.items;

          if(res.data.result.quotation_status == QuotationStatus.InReview ){
            this.isQuotable = false;
          }else if(res.data.result.quotation_status == QuotationStatus.FinaliseQuote){
            this.isQuotable = true;
          }

          this.models = this.cartItems.reduce((acc, item) => {
            if (item.is_cart) {
              acc.push(item);
            }
            return acc;
          }, []);
          this.promotionCost = Number(res.data.result?.promotion_details?.promotion_cost) || 0;

          if(res.data.result?.delivery_details?.delivery_type == "ShipToAddress"){
            if(res.data.result?.delivery_details?.shipping_method == "RoadExpress"){
                this.deliveryFee = 45;
            }else if(res.data.result?.delivery_details?.shipping_method == "Standard"){
                this.deliveryFee = 35;
            }
          }

          const materialTotals: { [key: string]: number } = {};

            this.models.forEach((model) => {
                const totalPrice = model.price;

                if (!materialTotals[model.materialId]) {
                    materialTotals[model.materialId] = 0;
                }
                materialTotals[model.materialId] += totalPrice;
            });

            this.models.forEach((model) => {
                if (materialTotals[model.materialId] < model.order_value) {
                    this.isOrderValueMatch = false;
                } else {
                    this.isOrderValueMatch = true;
                }
            });

          this.isProcessInstantQuote = !this.models.some(model => model.instant_quote === false);


          this.documents = _.cloneDeep(res.data.result.documents) || [];
          this.notes = res.data.result.notes || '';

          if(res.data.result.project_id){
            this.projectForm.get('project_id').setValue(res.data.result.project_id);
          }
          this.projectForm.disable();

          if (!this.models.length) {
            this._commonService.openErrorSnackBar("Please add items to cart")
            this.stepService.setStepCompleted(1, false)
            return this.router.navigate(["/create-order"])
          }

        })
      }

      getProjectList(){
        this._projectService.getAllProject('?skip_pagination=true').subscribe((result)=>{
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

      getModelName(url:string){
        return url.split('/').pop();
      }

      getLoggedInUserData() {
        this._userService.getLoggedUserData().subscribe((result: any) => {
          this.loggedInUserData = result.data.result as LoogedUserData;
          console.log(this.loggedInUserData,"log")
        })
      }

      openDocument(link: string) {
        window.open(this.getNoteFile(link), '_blank');
      }

      getNoteFile(filePath: any) {
        const serverFileName = filePath.split('/').pop();
        return this._fileManagementService.getFile("notes", serverFileName);
      }

      removeDocument(index: number) {
        this.documents.splice(index, 1);
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

        this._fileManagementService.uploadMultipleFiles("notes",formData).subscribe(
          (response) => {
            const doc = response.data.files.map((link) => {
              return {
                document_name: link.filename || '',
                document_type: link.filename?.split('.').pop() || '',
                document_link: link.filepath,
              };
            });
            doc.map((d)=> this.documents.push(d) );
          },
          (error) => {
            this._commonService.openErrorSnackBar(error.message);
          }
        );
      }

      onToggeleEdit(type?:string){
        if(this.isDocumentDisabled == false && type == "save"){
            this.quotation.documents = this.documents;
            this.quotation.notes = this.notes;
            this.quotation.project_id = this.projectForm.get('project_id').value;
            this.projectForm.disable();
            this.updateQuotation();
        }else if(this.isDocumentDisabled == false && type == "Cancel"){
            this.documents = _.cloneDeep(this.quotation.documents);
            this.notes = _.cloneDeep(this.quotation?.notes);
            this.projectForm.disable();
            this.projectForm.get('project_id').setValue(this.quotation.project_id);
        }
        this.isDocumentDisabled = !this.isDocumentDisabled;
        if(!this.isDocumentDisabled){this.projectForm.enable();}

      }

      updateQuotation(statsChange?:boolean){

        if(statsChange){
            this.quotation.quotation_status == QuotationStatus.QuoteCancel;
        }
        this._quotationService.updateQuotation(this.quotationId,this.quotation).subscribe((result)=>{
            if(result.statusCode === 200){
                if(statsChange){
                    this._commonService.openSnackBar("Quote cancelled successfully");
                    this.stepService.resetSteps();
                    this.router.navigate(["/upload-models"])
                }else{
                    this._commonService.openSnackBar("Notes Updated successfully");
                    this.getQutotation();
                }

            }else{
                this.getQutotation();
            }
        });
      }

      viewQuote(){
        this._quotationService.generateQuotePdf(this.quotationId).subscribe((result)=>{
            console.log(result,"result")
        })
      }

}
