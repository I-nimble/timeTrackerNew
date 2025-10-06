import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import moment from 'moment-timezone';

@Injectable({
  providedIn: 'root',
})
export class TimezoneService {
  private userTimezoneSubject = new BehaviorSubject<string>(this.detectUserTimezone());
  public userTimezone$ = this.userTimezoneSubject.asObservable();

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

  detectUserTimezone(): string {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (userTimezone && this.isValidTimezone(userTimezone)) {
        return userTimezone;
      }
      
      return 'UTC';
    } catch (error) {
      console.warn('Could not detect timezone, using UTC as fallback:', error);
      return 'UTC';
    }
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  convertLocalTimeToUTC(localTime: string, timezone?: string): string {
    try {
      const targetTimezone = timezone || this.userTimezoneSubject.value;
      
      const today = new Date();
      const [hours, minutes] = localTime.split(':');
      
      const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                                parseInt(hours), parseInt(minutes || '0'), 0);
      
      const utcTime = moment(localDate).tz(targetTimezone).utc().format('HH:mm:ss');
      return utcTime;
    } catch (error) {
      console.error('Error converting local time to UTC:', error);
      return '00:00:00';
    }
  }

  convertUTCToLocalTime(utcTime: string, timezone?: string): string {
    try {
      const targetTimezone = timezone || this.userTimezoneSubject.value;
      let cleanTime = utcTime;
      
      if (cleanTime.includes(':')) {
        const parts = cleanTime.split(':');
        cleanTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      
      const today = new Date();
      const [hours, minutes, seconds] = cleanTime.split(':');
      today.setUTCHours(parseInt(hours), parseInt(minutes || '0'), parseInt(seconds || '0'), 0);
      
      const localTime = moment(today).tz(targetTimezone).format('HH:mm');
      return localTime;
    } catch (error) {
      console.error('Error converting UTC to local time:', error);
      return '00:00';
    }
  }

  getCurrentTimezoneOffset(): string {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  setUserTimezone(timezone: string): void {
    if (this.isValidTimezone(timezone)) {
      this.userTimezoneSubject.next(timezone);
    } else {
      console.warn('Invalid timezone:', timezone);
    }
  }

  getCurrentTimezone(): string {
    return this.userTimezoneSubject.value;
  }
}
