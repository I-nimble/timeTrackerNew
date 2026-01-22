import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebSocketService } from './socket/web-socket.service';
import { GeolocationData } from '../models/geolocation.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private trackingSubject = new BehaviorSubject<boolean>(false);
  public tracking$ = this.trackingSubject.asObservable();

  private watchId: number | null = null;
  private lastLocation: { lat: number; lng: number; timestamp: number } | null = null;

  private readonly MIN_DISTANCE_METERS = 50;
  private readonly MIN_TIME_MS = 30000;
  private readonly POLL_INTERVAL_MS = 30000; // check every 30 seconds
  private readonly STALE_AGE_MS = 15 * 60 * 1000; // 15 minutes
  private pollTimer: any = null;

  constructor(
    private webSocketService: WebSocketService, 
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.deviceId = this.getDeviceId();
    this.checkGeolocationAvailability();
    this.setupAppLifecycleListeners();
  }

  public deviceId: string;
  public userId: string | null = localStorage.getItem('id');

  private checkGeolocationAvailability(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      this.openSnackBar('Geolocation is not supported. Please use a secure context (HTTPS) or a supported browser.', 'OK');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          this.openSnackBar('Location permissions are denied. Please enable them in your browser settings to use the tracker.', 'OK');
        }
        
        result.onchange = () => {
          if (result.state === 'denied') {
            this.openSnackBar('Location permissions are denied. Please enable them in your browser settings.', 'OK');
          } else if (result.state === 'granted') {
             this.startTracking();
             this.forceUpdate();
          }
        };
      });
    }
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      try {
        if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
          deviceId = (crypto as any).randomUUID();
        } else {
          deviceId = 'dev-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
        }
      } catch (e) {
        deviceId = 'dev-' + Date.now().toString(36);
      }
      localStorage.setItem('device_id', deviceId!);
    }
    return deviceId!;
  }

  private shouldBeTracking = false;
  private idleTimer: any;
  private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000;

  startTracking(): void {
    this.shouldBeTracking = true;
    this.resetIdleTimer();
    this.internalStartTracking();
    this.startPoll();
  }

  private internalStartTracking(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    if (this.watchId !== null) return;
    if (!navigator.onLine) {
      return;
    }

    this.trackingSubject.next(true);

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.handlePosition(position);
      },
      (error) => {
        console.error('WatchPosition Error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  stopTracking(): void {
    this.shouldBeTracking = false;
    this.clearIdleTimer();
    this.pauseTracking();
    this.trackingSubject.next(false);
    this.stopPoll();
  }

  private pauseTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private startPoll(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      try {
        this.userId = localStorage.getItem('id');
        if (!this.userId) return;
        this.http.get<any>(`${environment.apiUrl}/geolocation/${this.userId}/age`).subscribe({
          next: (resp) => {
            if (resp && typeof resp.ageMs === 'number') {
              if (resp.ageMs > this.STALE_AGE_MS) {
                this.forceUpdate();
              }
            }
          },
          error: (err) => {}
        });
      } catch (err) {}
    }, this.POLL_INTERVAL_MS);
  }

  private stopPoll(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private resumeTracking(): void {
    if (this.shouldBeTracking && this.watchId === null && navigator.onLine) {
      this.internalStartTracking();
    }
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();
    
    if (this.shouldBeTracking && this.watchId === null) {
      this.resumeTracking();
    }

    this.idleTimer = setTimeout(() => {
      this.pauseTracking();
    }, this.IDLE_TIMEOUT_MS);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private setupAppLifecycleListeners(): void {
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.resetIdleTimer();
        this.resumeTracking();
      }
    });

    window.addEventListener('online', () => {
      this.resumeTracking();
    });

    window.addEventListener('offline', () => {
      this.pauseTracking();
    });

    const interactionEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    interactionEvents.forEach(event => {
      window.addEventListener(event, () => this.resetIdleTimer(), { passive: true });
    });
  }

  private isUpdating = false;

  forceUpdate(force: boolean = false): void {
    if (!navigator.geolocation) return;
    if (this.isUpdating && !force) return;

    this.userId = localStorage.getItem('id');
    const now = Date.now();
    
    const isFreshEnough = this.lastLocation && (now - this.lastLocation.timestamp < 30000);
    if (!force && isFreshEnough) {
      this.processCachedUpdate();
      return;
    }

    this.isUpdating = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isUpdating = false;
        this.processUpdate(position);
        this.lastLocation = { 
          lat: position.coords.latitude, 
          lng: position.coords.longitude, 
          timestamp: position.timestamp 
        };
      },
      (error) => {
        this.isUpdating = false;
        if (error.code === 1) {
          if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
              if (result.state === 'denied') {
                this.openSnackBar('Please allow location permissions to use this feature.', 'OK');
              }
            });
          } else {
            this.openSnackBar('Please allow location permissions to use this feature.', 'OK');
          }
        } else if (error.code === 3) {
          if (this.watchId === null) {
             console.warn('Geolocation timeout on forceUpdate.');
          }
        } else {
          console.error('Error forcing location update:', error.message);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }

  private processCachedUpdate(): void {
    if (!this.lastLocation || !this.userId) return;
    const data: GeolocationData = {
      latitude: this.lastLocation.lat,
      longitude: this.lastLocation.lng,
      timestamp: new Date(this.lastLocation.timestamp).toISOString(),
      deviceId: this.deviceId,
      userId: this.userId
    };
    
    this.transmitUpdate(data);
  }

  private handlePosition(position: GeolocationPosition): void {
    const { latitude, longitude } = position.coords;
    const now = Date.now();

    if (this.shouldUpdate(latitude, longitude, now)) {
      this.processUpdate(position);
      this.lastLocation = { lat: latitude, lng: longitude, timestamp: now };
    }
  }

  private processUpdate(position: GeolocationPosition): void {
    if (!this.userId) return;
    const data: GeolocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date(position.timestamp).toISOString(),
      deviceId: this.deviceId,
      userId: this.userId
    };

    this.transmitUpdate(data);
  }

  private transmitUpdate(data: GeolocationData): void {
    if (this.webSocketService.isConnected()) {
      this.webSocketService.sendLocationUpdate(data);
    } else {
      this.sendLocationUpdateHttp(data);
    }
  }

  private sendLocationUpdateHttp(data: GeolocationData): void {
    this.http.post(`${environment.apiUrl}/geolocation`, data).subscribe({
      error: (err) => console.error('Error sending geolocation fallback update:', err)
    });
  }

  private shouldUpdate(lat: number, lng: number, now: number): boolean {
    if (!this.lastLocation) return true;
    if (now - this.lastLocation.timestamp > this.STALE_AGE_MS) return true;
    const dist = this.getDistanceFromLatLonInMeters(
      this.lastLocation.lat, this.lastLocation.lng,
      lat, lng
    );
    
    return dist > this.MIN_DISTANCE_METERS;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 6000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  private getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    var R = 6371e3;
    var dLat = this.deg2rad(lat2 - lat1);
    var dLon = this.deg2rad(lon2 - lon1);
    var a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
