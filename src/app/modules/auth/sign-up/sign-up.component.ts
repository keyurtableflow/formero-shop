import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AuthService } from 'app/core/auth/auth.service';
import { CommonService } from 'app/core/common/common.service';
import { UserService } from 'app/core/user/user.service';
import { Observable, map, startWith } from 'rxjs';

@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: fuseAnimations,
    standalone: true,
    imports: [MatSnackBarModule, CommonModule, RouterLink, FuseAlertComponent, NgIf, AsyncPipe, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule, MatAutocompleteModule, MatSelectModule],
    styleUrls: ['./sign-up.component.scss']
})
export class AuthSignUpComponent implements OnInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    countryList: any[] = [];
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    filteredOptions: Observable<any[]>;
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;
    isSignUpFormSubmittedSuccessfully: boolean = false;
    verifyAccountForm: FormGroup;
    otpStatus: string = "";
    isOtpInvalid: boolean = true;
    userDetails: any = null

    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _fuseConfirmationService: FuseConfirmationService,
        private _userService: UserService,
        private _commonService: CommonService,
        private _changeDetection: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        this.userDetails = JSON.parse(localStorage.getItem('details'))
        this.getCountryData();
        this.signUpForm = this._formBuilder.group({
            first_name: new FormControl('', Validators.required),
            last_name: new FormControl('', Validators.required),
            phone: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
            password: new FormControl('', [Validators.required, Validators.minLength(10)]),
            // country: new FormControl('', Validators.required),
            countryCode: new FormControl('+61', Validators.required),
            email: new FormControl('', [Validators.email, Validators.required]),
            domain: new FormControl('storefront', [Validators.required])
        });

        this.verifyAccountForm = new FormGroup({
            otp: new FormControl('', Validators.required),
        });

        // this.filteredOptions = this.signUpForm.get('country').valueChanges.pipe(
        //     startWith(''),
        //     map(value => this._filter(value || '')),
        // );

    }

    getCountryData() {
        this._userService.getCountries().subscribe((res: any) => {
            this.countryList = res;
        })
    }

    // private _filter(value: string): string[] {
    //     const filterValue = value.toLowerCase();

    //     return this.countryList.filter(option => option.name.toLowerCase().includes(filterValue));
    // }

    selectedCountry(e: any) {
        this.signUpForm.patchValue({
            countryCode: this.countryList.find(c => c.name === e.option.value).dial_code
        })
    }


    signUp(): void {
        if (this.signUpForm.invalid) {
            return;
        }
        this.signUpForm.disable();
        this.showAlert = false;
        const country = this.countryList.find((country) => country.dial_code === this.signUpForm.value.countryCode).name
        this._authService.signUp({ ...this.signUpForm.value, country })
            .subscribe(
                (result) => {
                    if (result.statusCode === 200) {
                        this._commonService.openSnackBar(result.message)
                        localStorage.setItem("details", JSON.stringify({ phone: this.signUpForm.value.phone, code: this.signUpForm.value.countryCode }))
                        this.userDetails = { phone: this.signUpForm.value.phone, code: this.signUpForm.value.countryCode }
                        this.signUpForm.enable()
                    }
                },
                (error: any) => {
                    this.signUpForm.enable();
                    this._commonService.openErrorSnackBar(error.error.message)
                },
            );
    }

    verifyAccount() {
        if (this.verifyAccountForm.valid) {
            this.verifyAccountForm.disable();
            this._authService.verifyOTP(this.userDetails.phone, this.verifyAccountForm.value.otp).subscribe((res) => {
                this._commonService.openSnackBar(res.message)
                localStorage.removeItem("details")
                this._router.navigate(["./sign-in"])
            }, (err) => {
                this._commonService.openErrorSnackBar(err.error.message)
                this.verifyAccountForm.enable();
            })
        } else {
            this.verifyAccountForm.markAllAsTouched();
        }
    }

    requestNewOTP() {
        // this.otpStatus = "Requesting..."
        this._authService.resendOTP(this.userDetails.phone).subscribe((res) => {
            // this.otpStatus = "Sent!"
            this._commonService.openSnackBar(res.message)
        }, (err) => {
            this._commonService.openErrorSnackBar(err.error.message)
        })
    }
}
