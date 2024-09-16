import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationExtras, Router } from '@angular/router';
import { StepService } from 'app/core/services/step.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as JSZip from 'jszip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FileManagementService } from 'app/core/services/file-management.service';
import { QuotationService } from 'app/core/services/quotation.service';
import { FuseLoadingService } from '@fuse/services/loading';

@Component({
    selector: 'app-upload-models',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './upload-models.component.html',
    styleUrls: ['./upload-models.component.scss']
})
export class UploadModelsComponent {

    @ViewChild('fileInput') fileInput: ElementRef;
    formCompleted = false;
    folderName: string = "3dFiles";
    fileListPath: any[] = [];
    quotationId:string;


    constructor(private router: Router, private stepService: StepService, private _fuseConfirmationService: FuseConfirmationService,
        private _fileManagementService: FileManagementService, private _quotationService: QuotationService, private _fuseLoadingService: FuseLoadingService,
        private _router:Router
    ) { }

    ngOnInit(): void {
        this.quotationId = this._quotationService.getQuotationId();
        if (this.quotationId) {
            this._router.navigate(['/create-order'])
        }
    }

    completeForm() {
        this.formCompleted = true;
        this.stepService.setStepCompleted(0, true);
        //   this.router.navigate(['/create-order']);
    }


    onFileSelected(event: any) {
        const files: FileList = event.target.files;
        this.uploadFiles(files);
    }

    uploadFiles(files: FileList) {
        this.fileListPath = [];
        let isAllFilesValid = true;

        const processPromises: Promise<void>[] = [];

        for (let i = 0; i < files.length; i++) {
            if (this.isFileSizeValid(files[i])) {
                processPromises.push(this.processFile(files[i]));
            } else {
                isAllFilesValid = false;
                this.showError({ error: { message: `The file "${files[i].name}" exceeds the 100 MB size limit.` } });
                break;
            }
        }
        if (isAllFilesValid) {
            Promise.all(processPromises).then(() => {
                this.uploadAllFiles();
            }).catch((error) => {
                this.showError(error);
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

    // Handle drag-over event
    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Handle drag-leave event
    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer?.files) {
            const files: FileList = event.dataTransfer.files;
            this.uploadFiles(files);
        }
    }

    uploadAllFiles() {
        const formData = new FormData();
        if (this.fileListPath.length === 1) {
            formData.append('files', this.fileListPath[0]);
            this._fileManagementService.uploadSingleFile(this.folderName, formData).subscribe((res) => {
                if (res?.statusCode == 200) {
                    this.fileListPath = [res.data];
                    this.addQuotation();
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
            this._fileManagementService.uploadMultipleFiles(this.folderName, formData).subscribe((res) => {
                if (res?.statusCode == 200) {
                    this.fileListPath = res.data.files;
                    this.addQuotation();
                } else {
                    this.showError({ error: { message: 'File upload failed' } });
                }
            }, (error: any) => {
                this.showError(error);
            });
        }
    }


    addQuotation() {
        const payload = this.getQuotationPayload();
        this._quotationService.addQuotation(payload).subscribe((res) => {
            if (res?.statusCode == 200) {
                const quotationId = res.data.quotationId;
                this._quotationService.setQuotationId(quotationId);
                this.navigateToNextRoute();
            }
        }, (error: any) => {
            this.showError(error);
        });
    }

    getQuotationPayload() {
        return {
            items: this.fileListPath.map(data => ({ model: data?.filepath ,model_name:data?.filename}))
        };
    }


    navigateToNextRoute() {
        this.completeForm();
        this.router.navigate(['/create-order']);
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
