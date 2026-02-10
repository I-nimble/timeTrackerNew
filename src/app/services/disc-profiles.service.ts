import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DiscProfile {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class DiscProfilesService {
  private API_URI = environment.apiUrl + '/disc-profiles';

  constructor(private http: HttpClient) {}

  getAll(): Observable<DiscProfile[]> {
    return this.http.get<DiscProfile[]>(`${this.API_URI}`);
  }

  assignToApplication(applicationId: number, discProfileIds: number[]): Observable<any> {
    return this.http.post(`${this.API_URI}/assign-application`, {
      application_id: applicationId,
      disc_profile_ids: discProfileIds
    });
  }

  assignToPosition(positionId: number, discProfileIds: number[]): Observable<any> {
    return this.http.post(`${this.API_URI}/assign-position`, {
      position_id: positionId,
      disc_profile_ids: discProfileIds
    });
  }

  getDiscProfileColor(profileName: string): string {
    const colors: { [key: string]: string } = {
      'Dominance': 'rgb(195, 227, 202)',
      'Influence': 'rgb(251, 205, 192)',
      'Steadiness': 'rgb(253, 229, 175)',
      'Conscientiousness': 'rgb(181, 218, 240)'
    };
    return colors[profileName] || '#ccc';
  }

  getDiscProfileInitial(profileName: string): string {
    return profileName ? profileName.charAt(0).toUpperCase() : '';
  }
}
