import { Component, Input, OnInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { Router } from '@angular/router';
import { ApplicationsService } from 'src/app/services/applications.service';
import { PdfViewerModule, PdfViewerComponent } from 'ng2-pdf-viewer';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-marketplace-cards',
  standalone: true,
  imports: [CommonModule, SharedModule, PdfViewerModule, RouterLink],
  templateUrl: './marketplace-cards.component.html',
  styleUrls: ['./marketplace-cards.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MarketplaceCardsComponent implements OnInit, AfterViewInit {
  @Input() selectedPosition: any = null;
  @ViewChild(PdfViewerComponent) pdfViewer!: PdfViewerComponent;
  @ViewChild('magnifier') magnifier!: ElementRef;
  @ViewChild('magnifierCanvas') magnifierCanvas!: ElementRef;

  resumesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/applications/resumes';
  cards: any[] = [];
  private startX = 0;
  loading: boolean = true;
  magnifierSize = 200;
  zoomLevel = 2;
  isHovering = false;
  private canvas?: HTMLCanvasElement;

  constructor(private router: Router, private cdr: ChangeDetectorRef, private applicationsService: ApplicationsService) { }

  ngOnInit(): void {
    this.applicationsService.getApplicationsByPosition(this.selectedPosition?.id).subscribe({
      next: (applications) => {
        this.cards = applications;
      }
    })
  }
  
  ngAfterViewInit(): void {
  }
  
  onPageRendered() {
    const cards = document.querySelectorAll('swiper-slide.card') as NodeListOf<HTMLElement>;
    cards.forEach((card: HTMLElement) => {
      const pdfViewer = card.querySelector('pdf-viewer') as HTMLElement;
      const pdfViewerPage = pdfViewer.querySelector('.page') as HTMLElement;
      pdfViewerPage.style.height = '447px';
      pdfViewerPage.style.width = '325px';
      const pdfViewerContainer = pdfViewer.querySelector('.ng2-pdf-viewer-container') as HTMLElement;
      pdfViewerContainer.style.display = 'flex';
      pdfViewerContainer.style.justifyContent = 'center';
      pdfViewerContainer.style.alignItems = 'center';
      pdfViewer.style.visibility = 'visible';
    });
    this.getCurrentCardCanvas();
    this.loading = false;
  }
  
  getCurrentCardCanvas() {
    this.canvas = document.querySelector('.card-container .card:first-child .pdf-viewer canvas') as HTMLCanvasElement;
  }

  onMouseEnter() {
    this.isHovering = true;
  }

  onMouseLeave() {
    this.isHovering = false;
  }

  public handleMouseMove(e: MouseEvent) {
    if (!this.isHovering) return;

    if(this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
  
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
  
      this.updateMagnifierPosition(e);
      this.updateMagnifierContent(this.canvas, mouseX, mouseY);
    }
    return;
  }

  private updateMagnifierPosition(e: MouseEvent) {
    const magnifier = this.magnifier.nativeElement;
    magnifier.style.left = `${e.clientX + 15}px`;
    magnifier.style.top = `${e.clientY + 15}px`;
  }

  private updateMagnifierContent(canvas: HTMLCanvasElement, x: number, y: number) {
    const magnifierCtx = (this.magnifierCanvas.nativeElement as HTMLCanvasElement).getContext('2d');
    if (!magnifierCtx) return;

    const sourceSize = this.magnifierSize / this.zoomLevel;
    const destSize = this.magnifierSize;

    // Ensure coordinates stay within canvas bounds
    const sx = Math.max(0, x - sourceSize/2);
    const sy = Math.max(0, y - sourceSize/2);
    const actualSize = Math.min(sourceSize, canvas.width - sx, canvas.height - sy);

    magnifierCtx.clearRect(0, 0, destSize, destSize);
    magnifierCtx.drawImage(
      canvas,
      sx, sy, actualSize, actualSize,
      0, 0, destSize, destSize
    );
  }

  onSwipeLeft(): void {
    this.addToInterestList();
  }
  
  onSwipeRight(): void {
    this.discardCard();
  }

  onTouchStart(event: any): void {
    this.startX = event.detail[1].clientX;
  }

  onTouchEnd(event: any): void {
    const endX = event.detail[1].clientX;
    const deltaX = endX - this.startX;

    if (deltaX > 50) {
      this.onSwipeRight();
    } else if (deltaX < -50) {
      this.onSwipeLeft();
    }
  }

  private discardCard(): void {
    this.cards.shift();
    this.resetSwiper();
    this.getCurrentCardCanvas();
  }

  private addToInterestList(): void {
    const cardToAdd = this.cards.shift();
    this.applicationsService.addSelectedCard(cardToAdd).subscribe({
      next: () => {
        this.resetSwiper();
        this.getCurrentCardCanvas();
      }
    });
  }

  private resetSwiper(): void {
    const swiperContainer = document.querySelector('swiper-container');
    if (swiperContainer?.swiper) {
      this.cdr.detectChanges();
      swiperContainer?.swiper.slideTo(0, 0);
      swiperContainer?.swiper.updateSlides();
      swiperContainer?.swiper.updateSlidesClasses();
      swiperContainer?.swiper.update();
      this.cdr.detectChanges();
    }
  }

  reviewCandidates(): void {
    this.router.navigate(['/client/roster-team']);
  }
}