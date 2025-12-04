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
  constructor(private fb: FormBuilder) {}
  @ViewChild('dropzone', { static: false }) dropzoneRef!: ElementRef<HTMLDivElement>;

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
      coreValues: this.fb.array([this.createItem('Three-Year Picture')]),
      coreFocus: this.fb.array([this.createItem()]),
      marketingStrategy: this.fb.array([this.createItem()]),
    });
  }

  onFileSelected(event: any) {
    const file = event.addedFiles?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  get coreValues() { return this.form.get('coreValues') as FormArray; }
  get coreFocus() { return this.form.get('coreFocus') as FormArray; }
  get marketingStrategy() { return this.form.get('marketingStrategy') as FormArray; }

  createItem(title: string = '') {
    return this.fb.group({ title: [title], value: [''] });
  }

  addRow(arrayName: string) {
    const arr = this.form.get(arrayName) as FormArray;
    arr.push(this.createItem());
  }
}