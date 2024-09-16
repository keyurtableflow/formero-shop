import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProjectWizardService {

    apiUrl: string = environment.API_URL;
    requestOptions = {
        headers: new HttpHeaders({
            'Accept-Version': 'v1'
        }),
    };

    constructor(private _httpClient: HttpClient) { }

    getAllProjectWizard(url): Observable<any> {
        return this._httpClient.get<any>(this.apiUrl + `Project` + url, this.requestOptions);
    }

    getProjectWizard(id: any): Observable<any> {
        return this._httpClient.get<any>(this.apiUrl + `Project/${id}`, this.requestOptions);
    }

    addProjectWizard(data: any): Observable<any> {
        return this._httpClient.post<any>(this.apiUrl + `Project`, data, this.requestOptions);
    }

    updateProjectWizard(id: any, data: any): Observable<any> {
        return this._httpClient.put<any>(this.apiUrl + `Project/${id}`, data, this.requestOptions);
    }

    deleteProjectWizard(id: any): Observable<any> {
        return this._httpClient.delete<any>(this.apiUrl + `Project/${id}`, this.requestOptions);
    }
}
