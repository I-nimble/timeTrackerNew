import { Component, OnInit, inject, OnDestroy, ViewChild, ElementRef, Inject, Input, Output, EventEmitter, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-jitsi-meet',
  templateUrl: './jitsi-meet.component.html',
  styleUrls: ['./jitsi-meet.component.scss'],
  standalone: true,
  imports: [MaterialModule, CommonModule],
})
export class JitsiMeetComponent implements OnInit, OnDestroy {
  @ViewChild('meetContainer', { static: true }) meetContainer!: ElementRef;
  @Input() dataInput: any;
  @Output() closed = new EventEmitter<void>();
  @Output() minimized = new EventEmitter<boolean>();
  api: any = null;
  domain = environment.jitsiMeetUrl;
  domainHost = '';
  isMinimized = false;
  isMobile = window.innerWidth <= 768;

  constructor(
    private hostElement: ElementRef,
    @Optional() public dialogRef: MatDialogRef<JitsiMeetComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
  ) {}

  async ngOnInit() {
    try {
      await this.loadExternalApi();
      try {
        const parsed = new URL(this.domain);
        this.domainHost = parsed.host;
      } catch (e) {
        this.domainHost = this.domain;
      }

      this.data = this.data || this.dataInput || this.data;

      await this.initJitsi();
    } catch (err) {
      console.error('Failed to load Jitsi API', err);
    }
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  loadExternalApi(): Promise<void> {
    if ((window as any).JitsiMeetExternalAPI) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.data?.externalApiUrl || 'https://meet.inimbleapp.com/external_api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error('Failed to load Jitsi external_api.js'));
      document.body.appendChild(script);
    });
  }

  async initJitsi() {
    const roomName = this.data?.roomName || `room-${this.data?.roomId || Date.now()}`;

    const configOverwrite = Object.assign({}, this.data?.configOverwrite || {});
    const interfaceConfigOverwrite = Object.assign({}, this.data?.interfaceConfigOverwrite || {});

    if (this.isMobile) {
      interfaceConfigOverwrite.MOBILE_APP_PROMO = false;

      configOverwrite.prejoinPageEnabled = false;
      (configOverwrite as any).disableDeepLinking = true;
    }

    const options: any = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: this.meetContainer.nativeElement,
      userInfo: {
        displayName: this.data?.displayName,
        email: this.data?.email
      },
      configOverwrite,
      interfaceConfigOverwrite,
      onload: () => {}
    };

    if (this.data?.jwt) {
      options.jwt = this.data.jwt;
    }

    try {
      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      this.api = new JitsiMeetExternalAPI(this.domainHost || this.domain, options);

      if (this.api && this.api.addEventListener) {
        this.api.addEventListener('readyToClose', () => {
          if (this.dialogRef) {
            try { this.dialogRef.close(); } catch (e) {}
          } else {
            this.closed.emit();
          }
        });
      }
    } catch (err) {
      console.error('Failed to initialize Jitsi Meet', err);
    }
  }

  ngOnDestroy() {
    if (this.api) {
      try {
        this.api.dispose();
      } catch (e) {}
      this.api = null;
    }
  }

  closeMeeting() {
    if (this.dialogRef) {
      try { this.dialogRef.close(); } catch (e) {}
    } else {
      try { this.closed.emit(); } catch (e) {}
    }
  }

  resize() {
    this.isMinimized = !this.isMinimized;
    try { this.minimized.emit(this.isMinimized); } catch (e) {}
    try {
      if (this.dialogRef) {
        if (this.isMinimized) {
          this.dialogRef.updateSize('600px', '300px');
          try { this.dialogRef.addPanelClass('jitsi-minimized'); } catch (e) {}
          try { this.dialogRef.removePanelClass('jitsi-fullscreen-dialog'); } catch (e) {}
        } else {
          this.dialogRef.updateSize('100vw', '100vh');
          try { this.dialogRef.removePanelClass('jitsi-minimized'); } catch (e) {}
          try { this.dialogRef.addPanelClass('jitsi-fullscreen-dialog'); } catch (e) {}
        }
      } else {
        const host = (this.hostElement && (this.hostElement as any).nativeElement) || null;
        if (host) {
          if (this.isMinimized) {
            host.classList.add('jitsi-minimized');
            host.classList.remove('jitsi-fullscreen');
          } else {
            host.classList.remove('jitsi-minimized');
            host.classList.add('jitsi-fullscreen');
          }
        }
      }
    } catch (e) {}
  }
}
