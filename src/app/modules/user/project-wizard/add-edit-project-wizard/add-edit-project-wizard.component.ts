import { Component } from '@angular/core';
import { AsyncPipe, CommonModule, JsonPipe, NgFor, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FuseAlertComponent } from '@fuse/components/alert';
import { FuseHighlightComponent } from '@fuse/components/highlight';
import { ProjectWizardService } from 'app/core/services/project-wizard.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    selector: 'app-add-edit-project-wizard',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, AsyncPipe, MatAutocompleteModule, MatIconModule, FuseAlertComponent, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatSelectModule, NgFor, MatOptionModule, MatButtonModule, FuseHighlightComponent, JsonPipe, TitleCasePipe],
    templateUrl: './add-edit-project-wizard.component.html',
    styleUrls: ['./add-edit-project-wizard.component.scss']
})

export class AddEditProjectWizardComponent {
    projectWizardId: any;
    projectWizardForm: UntypedFormGroup;
    Status = Status;
    alert: any = null;

    constructor(private _formBuilder: UntypedFormBuilder,
        private _projectWizardService: ProjectWizardService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        this._route.params.subscribe(params => {
            this.projectWizardId = params['id']; // Access the 'id' parameter from the URL
          });
    }

    ngOnInit(): void {
        this.projectWizardForm = this._formBuilder.group({
            name: new FormControl('', Validators.required),
            status: new FormControl('', Validators.required),
        });

        if (this.projectWizardId)
            this.getProjectWizard(this.projectWizardId)
    }

    getProjectWizard(id:any){
        this._projectWizardService.getProjectWizard(id).subscribe( (result : any) => {
          if(result.statusCode == 200){
            this.projectWizardForm.patchValue(result?.data?.result)
          }
        })
      }

    submit() {
        if (this.projectWizardForm.invalid) {
            return
        }

        let result$: any;
        if (!this.projectWizardId) {
            result$ = this._projectWizardService.addProjectWizard(this.projectWizardForm.value)
        } else {
            result$ = this._projectWizardService.updateProjectWizard(this.projectWizardId, this.projectWizardForm.value)
        }

        result$.subscribe((response: any) => {
            if (response.statusCode == 201 || response.statusCode == 200) {
                this.alert = {
                    "title": "Success",
                    "message": this.projectWizardId ? "Project Wizard Updated Successfully" : "Project Wizard Created Successfully",
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
                this.openConfirmationDialog(this.alert);
            }
        }, (error: any) => {
            this.showError(error);
        })
    }

    openConfirmationDialog(data: any): void {
        // Open the dialog and save the reference of it
        const dialogRef = this._fuseConfirmationService.open(data);

        // Subscribe to afterClosed from the dialog reference
        dialogRef.afterClosed().subscribe((result) => {
            console.log(result)
            if (result == 'confirmed')
                this._router.navigateByUrl('/project-wizard/list')
        });
    }

    showError(err : any){
        this.alert = {
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
        this.openConfirmationDialog(this.alert);
    }
}

export const Status = {
    Active: true,
    Inactive: false
  };
