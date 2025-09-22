import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  constructor(private platform: Platform) {}
  
  isMobile(): boolean {
    return this.platform.is('mobile') || this.platform.is('mobileweb');
  }
  
  isDesktop(): boolean {
    return this.platform.is('desktop');
  }
  
  isAndroid(): boolean {
    return this.platform.is('android');
  }
  
  isIOS(): boolean {
    return this.platform.is('ios');
  }
}