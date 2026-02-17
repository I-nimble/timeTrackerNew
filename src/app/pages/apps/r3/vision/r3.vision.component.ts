import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { R3Service } from 'src/app/services/r3.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-r3-vision',
  templateUrl: './r3.vision.component.html',
  styleUrls: ['./r3.vision.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCard,
    NgxDropzoneModule,
  ],
})

export class R3VisionComponent implements OnInit {
  form: FormGroup;
  selectedImage: string | null = null;
  deletedVisionItemIds: number[] = [];
  currentVisionId: number | null = null;
  uploadingMap: Record<number, boolean> = {};
  assetsBase = environment.assets;
  
  constructor(private fb: FormBuilder, private r3Service: R3Service, public snackBar: MatSnackBar) {}
  @ViewChild('dropzone', { static: false }) dropzoneRef!: ElementRef<HTMLDivElement>;

  get coreValues() { return this.form.get('coreValues') as FormArray; }
  get coreFocus() { return this.form.get('coreFocus') as FormArray; }
  get marketingStrategy() { return this.form.get('marketingStrategy') as FormArray; }

  ngAfterViewInit(): void {
    const dropzone = this.dropzoneRef.nativeElement;
    const input = dropzone.querySelector<HTMLInputElement>('.file-input-hidden');
    const placeholder = dropzone.querySelector<HTMLDivElement>('.dropzone-content');

    input?.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          if (placeholder) placeholder.style.opacity = '0';
          let img = dropzone.querySelector<HTMLImageElement>('.uploaded-preview');
          if (!img) {
            img = document.createElement('img');
            img.classList.add('uploaded-preview');
            dropzone.appendChild(img);
          }
          img.src = src;
        };
        reader.readAsDataURL(files[0]);
      }
    });
  }

  ngOnInit() {
    this.form = this.fb.group({
      year: [new Date().getFullYear(), Validators.required],
      coreValues: this.fb.array([]),
      coreFocus: this.fb.array([]),
      marketingStrategy: this.fb.array([]),
    });

    this.loadR3VisionData();
  }

  loadR3VisionData() {
    this.r3Service.getR3Module().subscribe((data: any) => {
      if (!data || !data.visions || data.visions.length === 0) return;
      const vision = data.visions[0];
      if (vision.createdAt) {
        const year = new Date(vision.createdAt).getFullYear();
        this.form.patchValue({ year });
      }
      this.coreValues.clear();
      this.coreFocus.clear();
      this.marketingStrategy.clear();
      this.currentVisionId = vision.id;
      vision.r3_vision_items.forEach((item: any) => {
        const group = this.createItem(
          item.three_year_picture,
          item.description,
          item.id,
          item.three_year_picture
        );
        switch (item.type) {
          case 'core_value':
            this.coreValues.push(group);
            break;
          case 'core_focus':
            this.coreFocus.push(group);
            break;
          case 'marketing_strategy':
            this.marketingStrategy.push(group);
            break;
        }
      });
      if (vision.image_url) {
        this.selectedImage = vision.image_url;
      }
    });
  }

  onFileSelected(event: any, itemIndex: number, arrayName: string) {
    const file: File = event.addedFiles?.[0];
    if (!file) return;
    const array = this.form.get(arrayName) as FormArray;
    const item = array.at(itemIndex);
    this.uploadingMap[itemIndex] = true;
    this.r3Service.uploadVisionItem(file).subscribe({
      next: (res: any) => {
        if (res && res.key) {
          item.patchValue({ picture: res.key });
        }
        this.uploadingMap[itemIndex] = false;
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.uploadingMap[itemIndex] = false;
      }
    });
  }

  downloadImage(fileKey: string | null) {
    if (!fileKey) return;
    const url = `https://inimble-app.s3.us-east-1.amazonaws.com/${fileKey}`;
    window.open(url, '_blank');
  }

  createItem(title: string = '', value: string = '', id: number | null = null, picture: string | null = null) {
    return this.fb.group({
      id: [id],
      title: [title],
      value: [value],
      picture: [picture]
    });
  }

  addRow(arrayName: string) {
    const arr = this.form.get(arrayName) as FormArray;
    arr.push(this.createItem());
  }

  deleteItem(arrayName: string, index: number) {
    const arr = this.form.get(arrayName) as FormArray;
    const item = arr.at(index);
    const existingId = item.get('id')?.value;
    if (existingId) {
      this.deletedVisionItemIds.push(existingId);
    }
    arr.removeAt(index);
  }

  saveVision() {
    const visionItems = [
      ...this.coreValues.value.map((v: any) => ({
        id: v.id || null,
        type: "core_value",
        description: v.value,
        three_year_picture: v.picture || null
      })),
      ...this.coreFocus.value.map((v: any) => ({
        id: v.id || null,
        type: "core_focus",
        description: v.value,
        three_year_picture: v.picture || null
      })),
      ...this.marketingStrategy.value.map((v: any) => ({
        id: v.id || null,
        type: "marketing_strategy",
        description: v.value,
        three_year_picture: v.picture || null
      }))
    ];

    const payload = {
      visions: [
        {
          id: this.currentVisionId,
          vision_items: visionItems
        }
      ],
      deleted_vision_item_ids: this.deletedVisionItemIds,
      deleted_vision_ids: []
    };
    this.r3Service.saveVision(payload.visions, [], this.deletedVisionItemIds)
      .subscribe(res => {
        this.openSnackBar('Vision saved!', 'close');
      });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  } 
}