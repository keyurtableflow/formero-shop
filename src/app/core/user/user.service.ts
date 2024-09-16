import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from 'app/core/user/user.types';
import { environment } from 'environments/environment.development';
import { map, Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
    apiUrl: string = environment.API_URL;

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    headerDict = {
        'Accept-Version': 'v1'
    }

    requestOptions = {
        headers: new HttpHeaders(this.headerDict),
    };

    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    getCountries() {
        return this._httpClient.get('/assets/CountryCodes.json');
    }

    update(user: User): Observable<any> {
        return this._httpClient.patch<User>('api/common/user', { user }).pipe(
            map((response) => {
                this._user.next(response);
            }),
        );
    }

    getLoggedUserData() {
        return this._httpClient.get(this.apiUrl + 'user/profile', {
            headers: new HttpHeaders({
                'Accept-Version': 'v1'
            })
        })
    }
}
