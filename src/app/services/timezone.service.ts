import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimezoneService {
  constructor(private http: HttpClient) {}

  API_URI = `${environment.apiUrl}/timezones`

  fetchTimezonesApi() {
    return this.http.get(`${this.API_URI}`);
  }
  convertTimezone(timezone: any) {
    const { countryName, timestamp, gmtOffset, zoneName, countryCode } =
      timezone;
    const fechaHoraActual = new Date()
      .toLocaleTimeString(countryCode, {
        timeZone: zoneName,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .toUpperCase()
      .replace('.', '');
    return fechaHoraActual;
  }
}
