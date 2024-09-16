import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {

    apiUrl: string = environment.API_URL;
    requestOptions = {
        headers: new HttpHeaders({
            'Accept-Version': 'v1'
        }),
    };

    constructor(private _httpClient: HttpClient) { }

    getAllProject(url): Observable<any> {
        return this._httpClient.get<any>(this.apiUrl + `Project` + url, this.requestOptions);
    }

    getProject(id: any): Observable<any> {
        return this._httpClient.get<any>(this.apiUrl + `Project/${id}`, this.requestOptions);
    }

    addProject(data: any): Observable<any> {
        return this._httpClient.post<any>(this.apiUrl + `Project`, data, this.requestOptions);
    }

    updateProject(id: any, data: any): Observable<any> {
        return this._httpClient.put<any>(this.apiUrl + `Project/${id}`, data, this.requestOptions);
    }

    deleteProject(id: any): Observable<any> {
        return this._httpClient.delete<any>(this.apiUrl + `Project/${id}`, this.requestOptions);
    }
}
