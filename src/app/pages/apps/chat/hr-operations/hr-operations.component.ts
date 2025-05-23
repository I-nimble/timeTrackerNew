import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-hr-operations',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './hr-operations.component.html',
  styleUrl: './hr-operations.component.scss'
})
export class HrOperationsComponent {
  safeChatUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    const url = 'https://tawk.to/chat/67101a094304e3196ad2ecce/1iabebdro';
    this.safeChatUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
