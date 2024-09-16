import { ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FuseCardComponent } from '@fuse/components/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { QuotationService } from 'app/core/services/quotation.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FormsModule } from '@angular/forms';
import { ModelviewerComponent } from "./modelviewer/modelviewer.component";
import * as JSZip from 'jszip';

@Component({
    selector: 'app-quotation',
    standalone: true,
    templateUrl: './quotation.component.html',
    styleUrls: ['./quotation.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, NgIf, NgFor, MatExpansionModule, FormsModule, MatButtonModule, RouterLink, MatIconModule, MatMenuModule, MatSlideToggleModule, FuseCardComponent, MatTooltipModule, MatFormFieldModule, MatOptionModule, MatAutocompleteModule, MatSelectModule, MatInputModule, ModelviewerComponent]
})
export class QuotationComponent {

    showThikness:boolean = true;
    bulkPrice: boolean = false;
    totalRecords:number;
    processList:any[] = [];
    materialList:any[] = [];
    selectedProcessIndex:number = 0;
    selectedMaterial:string;
    isInDialog:boolean = false;
    files:any;
    filesList: File[] = [];
    degree:any = 270;

    constructor( private _quotationService:QuotationService,private _changeDetectorRef: ChangeDetectorRef,private _router: Router, private _fuseConfirmationService: FuseConfirmationService,){}

    ngOnInit(): void {
        this.getProcessList();
    }


    showBulkPrice(){
        this.bulkPrice =! this.bulkPrice;
    }

    onFileChange(event: any){
        // this.files = event;
        const file = event?.target?.files[0];
        if (file) {
            this.processFile(file);
          }
    }

    processFile(file: File) {
        if (file.name.endsWith('.zip')) {
          this.handleZip(file);
          setTimeout(() => {
          this.files = this.filesList[0];
          }, 200);
        } else {
          this.filesList.push(file);
          this.files = this.filesList[0];

        }

      }

      handleZip(file: File) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const contents = event.target?.result;
          if (!contents || typeof contents === 'string') return;

          JSZip.loadAsync(contents as ArrayBuffer).then((zip) => {
            zip.forEach((relativePath, zipEntry) => {
              zipEntry.async('arraybuffer').then((fileData) => {
                const blob = new Blob([fileData]);
                const extractedFile = new File([blob], zipEntry.name);
                this.filesList.push(extractedFile);
              });
            });
          });
        };
        reader.readAsArrayBuffer(file);
      }

      onFileSelected(file:any){
        console.log(file,"file");

        this.files = file;
      }

    getProcessList(){
        this._quotationService.getAllProcessList('limit:1000').subscribe((result)=>{
            if (result.statusCode == 200) {
                this.processList = result?.data.result;
                this.totalRecords = result.data?.totalCount;
                this.getMaterialBasedOnProcess(result?.data.result[0]._id);
                this._changeDetectorRef.detectChanges();
            }
        }, (error: any) => {
            if (error.status == 401) {
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
        };;
        this.openConfirmationDialog(alert);
    }

    openConfirmationDialog(data: any): void {
        this._fuseConfirmationService.open(data);
    }

    onProcessSelected(process:any,index:number){
        this.degree = "0";
        this.selectedProcessIndex = index;
        this.getMaterialBasedOnProcess(process?._id);
    }

    getMaterialBasedOnProcess(id:string){
        this._quotationService.getMaterialFromProcessId(id).subscribe((result)=>{
            if(result.statusCode== 200){
                this.materialList = result?.data.result;
                this._changeDetectorRef.detectChanges();
                // console.log(this.materialList,"material list")

            }
        }, (error: any) => {
            if (error.status == 401) {
                this._router.navigateByUrl('sign-in');
            }
            this.showError(error);
        });
    }

    onMaterialSelectd(){
        // console.log(this.selectedMaterial,"material")
    }


}

