import { Injectable } from '@angular/core';
import { load } from '@fingerprintjs/fingerprintjs';

@Injectable({
  providedIn: 'root'
})
export class FingerprintService {

  async getFingerprint(): Promise<string> {
    const stored = localStorage.getItem('fp');
    if (stored) {
      return stored;
    }
    const fp = await load();
    const result = await fp.get();
    localStorage.setItem('fp', result.visitorId);
    return result.visitorId;
  }
}