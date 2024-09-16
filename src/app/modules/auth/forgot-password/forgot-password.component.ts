import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector     : 'auth-forgot-password',
    templateUrl  : './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports: [CommonModule, RouterLink, FuseAlertComponent, NgIf, AsyncPipe, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule, MatAutocompleteModule],
})
export class AuthForgotPasswordComponent implements OnInit
{
    @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: '',
    };
    forgotPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;
    isFormSubmit:boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Create the form
        this.forgotPasswordForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Send the reset link
     */
    sendResetLink(): void
    {
        // Return if the form is invalid
        if ( this.forgotPasswordForm.invalid )
        {
            return;
        }

        // Disable the form
        this.forgotPasswordForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Forgot password
        this._authService.forgotPassword(this.forgotPasswordForm.get('email').value)
            .pipe(
                finalize(() =>
                {
                    // Re-enable the form
                    this.forgotPasswordForm.enable();

                    // Show the alert
                    this.showAlert = true;
                }),
            )
            .subscribe(
                (response) =>
                {
                    // Set the alert
                    this.alert = {
                        type   : 'success',
                        message: 'Password reset sent! You\'ll receive an email if you are registered on our system.',
                    };
                    this.isFormSubmit = true;

                },
                (response) =>
                {
                    // Set the alert
                    this.alert = {
                        type   : 'error',
                        message: 'Email does not found! Are you sure you are already a member?',
                    };
                },
            );
    }
}
