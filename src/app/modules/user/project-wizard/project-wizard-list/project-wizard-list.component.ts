import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { AsyncPipe, CommonModule, CurrencyPipe, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { Subject, debounceTime } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ProjectWizardService } from 'app/core/services/project-wizard.service';

@Component({
    selector: 'app-project-wizard-list',
    standalone: true,
    imports: [CommonModule, NgIf, MatProgressBarModule, MatFormFieldModule, MatIconModule, MatMenuModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatSortModule, NgFor, NgTemplateOutlet, MatPaginatorModule, NgClass, MatSlideToggleModule, MatSelectModule, MatOptionModule, MatCheckboxModule, MatRippleModule, AsyncPipe, CurrencyPipe],
    templateUrl: './project-wizard-list.component.html',
    styleUrls: ['./project-wizard-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
})
export class ProjectWizardListComponent {
    isLoading: boolean = false;
    searchInputControl: UntypedFormControl = new UntypedFormControl('');
    private searchSubject = new Subject<string>();

    totalRecords: number = 0;
    currentPage: number = 0;
    pageSize: number = 10;

    projectWizardList: any[] = [];
    sortedData: any[] = [];
    sortColumn: string;
    sortOrder: number;

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private readonly debounceTimeMs = 300;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _fuseConfirmationService: FuseConfirmationService,
        private _projectWizardService: ProjectWizardService
    ) {
    }

    ngOnInit(): void {
        this.getProjectWizardList(this.pageSize, this.currentPage, this.searchInputControl.value);
        this.searchSubject.pipe(debounceTime(this.debounceTimeMs)).subscribe((searchValue: any) => {
            this.performSearch(searchValue);
        });
    }


    searchRecord() {
        this.searchSubject.next(this.searchInputControl.value);
    }


    performSearch(input: any) {
        this.getProjectWizardList(this.pageSize, this.currentPage, input);
    }

    redirectToAddProjectWizard() {
        this._router.navigateByUrl('project-wizard/add-project-wizard')
    }

    getProjectWizardList(size: number = 0, current: number, search: string = '', sortColumn: string = 'created_at', sortOrder: number = 1) {
        this.pageSize = size;
        this.currentPage = current;
        let url = `?limit=${size}&page=${current + 1}&orderby=${sortColumn}&sort=${sortOrder}`
        if (search != '') {
            url += `&search=${search}`
        }
        this._projectWizardService.getAllProjectWizard(url).subscribe((result: any) => {
            if (result.statusCode == 200) {
                this.projectWizardList = result.data?.result;
                this.sortedData = this.projectWizardList.slice();
                this.totalRecords = result.data?.totalCount;
                this._changeDetectorRef.detectChanges();
            }
        }, (error: any) => {
            if (error.status == 401) {
                this._router.navigateByUrl('sign-in')
            }
        });
    }

    sortData(sort: Sort) {
        this.sortColumn = sort.active;
        this.sortOrder = sort.direction == 'asc' ? 1 : -1;
        this.getProjectWizardList(this.pageSize, this.currentPage, this.searchInputControl.value, sort.active, sort.direction == 'asc' ? 1 : -1)
    }

    editProjectWizard(id) {
        this._router.navigateByUrl('project-wizard/edit-project-wizard/' + id)
    }

    deleteProjectWizard(id) {
        let alert = {
            "title": "Delete Project Wizard",
            "message": "Are you sure you want to delete this Project Wizard ?",
            "icon": {
                "show": true,
                "name": "heroicons_outline:exclamation-triangle",
                "color": "warn"
            },
            "actions": {
                "confirm": {
                    "show": true,
                    "label": "Yes, Delete It!",
                    "color": "warn"
                },
                "cancel": {
                    "show": true,
                    "label": "Cancel"
                }
            }
        };
        this.openConfirmationDialog(alert, id);
    }

    openConfirmationDialog(data: any, id?: any): void {

        const dialogRef = this._fuseConfirmationService.open(data);

        dialogRef.afterClosed().subscribe((result) => {
            if (result == 'confirmed') {
                this._projectWizardService.deleteProjectWizard(id).subscribe((response: any) => {
                    if (response.statusCode == 200) {
                        this.getProjectWizardList(10, 0,this.searchInputControl.value);
                        let alert: any = {
                            "title": "Success",
                            "message": "Project Wizard Deleted Successfully",
                            "icon": {
                                "show": true,
                                "name": "heroicons_outline:check-badge",
                                "color": "success"
                            },
                            "actions": {
                                "confirm": {
                                    "show": true,
                                    "label": "Okay",
                                    "color": "accent"
                                },
                                "cancel": {
                                    "show": false,
                                    "label": "Cancel"
                                }
                            }
                        };
                        this._fuseConfirmationService.open(alert);

                    }
                }, (error: any) => {
                    this.showError(error);
                })
            }
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

    onPageChange(e: any) {
        this.getProjectWizardList(e.pageSize, e.pageIndex, this.searchInputControl.value, this.sortColumn, this.sortOrder)
    }
    onPageSizeChange(e: any) {
        this.getProjectWizardList(e.pageSize, e.pageIndex, this.searchInputControl.value, this.sortColumn, this.sortOrder)
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

}
