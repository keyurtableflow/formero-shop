import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment.development';
import { Observable } from 'rxjs';
import { QuotationStatus } from '../models/quotation-status.enum';

@Injectable({
    providedIn: 'root'
})
export class QuotationService {

    apiUrl: string = environment.API_URL;
    requestOptions = {
        headers: new HttpHeaders({
            'Accept-Version': 'v1'
        }),
    };

    private readonly STORAGE_KEY = 'quotationId';

    constructor(private _httpClient: HttpClient) { }

    setQuotationId(id: string) {
        localStorage.setItem(this.STORAGE_KEY, id);
    }

    getQuotationId(): string | null {
        return localStorage.getItem(this.STORAGE_KEY);
    }

    clearQuotationId() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    getAllProcessList(url: any) {
        return this._httpClient.get<any>(this.apiUrl + `process?` + url, this.requestOptions);
    }

    getMaterialFromProcessId(id: string) {
        return this._httpClient.get<any>(this.apiUrl + `process/` + id, this.requestOptions);
    }

    getAllFinishes(url): Observable<any> {
        return this._httpClient.get<any>(this.apiUrl + `finishes` + url, this.requestOptions);
    }

    getAllQuotation(url): Observable<any> {
        return this._httpClient.get<any>(this.apiUrl + `quotation` + url, this.requestOptions);
    }

    addQuotation(data: any): Observable<any> {
        return this._httpClient.post<any>(this.apiUrl + `quotation`, data, this.requestOptions);
    }

    updateQuotation(id: any, data: any): Observable<any> {
        return this._httpClient.put<any>(this.apiUrl + `quotation/${id}`, data, this.requestOptions);
    }

    getQuotationById(id: any): Observable<any> {
        return this._httpClient.get<any>(this.apiUrl + `quotation/${id}`, this.requestOptions);
    }

    deleteQuotation(id: any): Observable<any> {
        return this._httpClient.delete<any>(this.apiUrl + `quotation/${id}`, this.requestOptions);
    }

    addModelInQuatation(id: any, data: any): Observable<any> {
        return this._httpClient.put<any>(this.apiUrl + `quotation/add-model/${id}`, data, this.requestOptions);
    }


    updateModelInCart(quotationId: string, itemId: string,data: any){
        return this._httpClient.put<any>(this.apiUrl + `quotation/cart-item/${quotationId}/${itemId}`, data, this.requestOptions);
    }

    removeModelFromRail(quotationId: string, itemId: string): Observable<any> {
        return this._httpClient.delete<any>(this.apiUrl + `quotation/cart-item/${quotationId}/${itemId}`, this.requestOptions);
    }

    calculateProcessPrice(url){
        return this._httpClient.get<any>(this.apiUrl + `pricing-model/calculate/` + url, this.requestOptions);
    }

    validatPromoCode(promocCode:string){
        return this._httpClient.get<any>(this.apiUrl + `promotions/code/` + promocCode, this.requestOptions);
    }

    generateQuotePdf(id:string){
        return this._httpClient.post<any>(this.apiUrl + `quotation/generate-pdf/` + id, '', this.requestOptions);
    }

}
