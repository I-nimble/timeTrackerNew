import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Loader } from 'src/app/app.models';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [FormsModule, CommonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent implements OnInit {
  constructor() {}
  @Input() loader: Loader = new Loader(false, false, false);
  @Input() message: string | null = null;
  @Input() diameter: number = 44;

  ngOnInit(): void {}
}