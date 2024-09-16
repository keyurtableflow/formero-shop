import { Routes } from '@angular/router';
import { ProjectWizardComponent } from './project-wizard.component';
import { ProjectWizardListComponent } from './project-wizard-list/project-wizard-list.component';
import { AddEditProjectWizardComponent } from './add-edit-project-wizard/add-edit-project-wizard.component';



export default [
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'list',
    },
    {
        path     : 'list',
        component: ProjectWizardComponent,
        children : [
            {
                path     : '',
                component: ProjectWizardListComponent
            },
        ],
    },
    {
        path     : 'add-project-wizard',
        component: AddEditProjectWizardComponent
    },
    {
        path     : 'edit-project-wizard/:id',
        component: AddEditProjectWizardComponent
    },
] as Routes;
