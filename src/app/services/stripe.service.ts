import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  stripe = stripe(environment.stripePublicKey);
  constructor(private http: HttpClient) { }

  charge(body: any){
    const headers = new HttpHeaders({'content_type':'application/json'})
    return this.http.post<any>(environment.apiUrl+'/stripe/checkout', body, {headers})
  }

}
