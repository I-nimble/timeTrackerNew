import { Injectable } from '@angular/core';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

@Injectable({
  providedIn: 'root'
})
export class FingerprintService {

  async getFingerprint(): Promise<string> {
    const stored = localStorage.getItem('fp');
    if (stored) {
      return stored;
    }
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    localStorage.setItem('fp', result.visitorId);
    return result.visitorId;
  }
}