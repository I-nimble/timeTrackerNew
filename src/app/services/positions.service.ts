import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Positions } from '../models/Position.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PositionsService {
  constructor(private http: HttpClient) {}
  private selectedPosition?: any
  private API_URI = environment.apiUrl + '/positions';

  public get(): Observable<Positions[]> {
    return this.http.get<Positions[]>(`${this.API_URI}`);
  }

  getCompanyPositions(){
    return this.http.post<any[]>(`${this.API_URI}/company`, {});
  }

  public submit(data: any, id: any = null) {
    if (id) return this.http.put(`${this.API_URI}/${id}`, data);
    return this.http.post(`${this.API_URI}`, data);
  }

  public delete(id: number){
    return this.http.delete(`${this.API_URI}/${id}`)
  }

  setSelectedPosition(position: any) {
    this.selectedPosition = position;
  }
  getSelectedPosition() {
    return this.selectedPosition;
  }
  resetPosition() {
    this.selectedPosition = null;
  }
}
