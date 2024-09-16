import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { environment } from 'environments/environment.development';
import { BehaviorSubject, catchError, Observable, of, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    public _authenticated: boolean = false;
    private loggedInSubject = new BehaviorSubject<boolean>(false);
    apiUrl: string = environment.API_URL;

    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
        private _router: Router
    ) {
    }

    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken');
    }

    set refreshToken(token: string) {
        localStorage.setItem('refreshToken', token);
    }

    get refreshToken(): string {
        return localStorage.getItem('refreshToken') ?? '';
    }

    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    verifyOTP(phone: string, otp: string): Observable<any> {
        return this._httpClient.post(this.apiUrl + 'auth/otp-verification', { phone: phone, otp: otp }).pipe(
            switchMap((response: any) => {
                if (response.statusCode == 200) {
                    this.loggedInSubject.next(true);
                    this.accessToken = response.data.token;
                    // this.refreshToken = response.data.refreshToken;
                    this._authenticated = true;
                    // this._userService.user = response?.data.user;
                    return of(response);
                }
            }),
        );;
    }

    resendOTP(phone: string): Observable<any> {
        return this._httpClient.post(this.apiUrl + 'auth/resend-otp', { phone });
    }

    resetPassword(password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    signIn(credentials: { phone: string }): Observable<any> {
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        return this._httpClient.post(this.apiUrl + 'auth/login', credentials).pipe(
            switchMap((response: any) => {
                return of(response);
            }),
        );
    }

    signInUsingToken(): Observable<any> {
        return this._httpClient.post('api/auth/sign-in-with-token', {
            accessToken: this.accessToken,
        }).pipe(
            catchError(() =>
                of(false),
            ),
            switchMap((response: any) => {
                if (response.accessToken) {
                    this.accessToken = response.accessToken;
                }

                this._authenticated = true;
                this._userService.user = response.user;
                return of(true);
            }),
        );
    }

    signOut(): Observable<any> {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');
        localStorage.clear();

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        // return of(true);
        return this._httpClient.get(this.apiUrl + 'auth/logout', {
            headers: new HttpHeaders({
                'Accept-Version': 'v1'
            })
        })
    }

    signUp(user: { first_name: string; last_name: string; country: string; countryCode: string; email: string; phone: string; password: string }): Observable<any> {
        return this._httpClient.post(this.apiUrl + 'auth/signup', user);
    }

    check(): Observable<boolean> {
        if (this._authenticated) {
            return of(true);
        }

        if (!this.accessToken) {
            return of(false);
        }

        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }
        return this.isLoggedIn();
    }

    isLoggedIn(): Observable<boolean> {
        return this.loggedInSubject;
    }
}
