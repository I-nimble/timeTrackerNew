import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TablerIconsModule } from 'angular-tabler-icons';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { MaterialModule } from 'src/app/legacy/material.module';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-customizer',
  imports: [TablerIconsModule, MaterialModule, FormsModule, NgScrollbarModule],
  templateUrl: './customizer.component.html',
  styleUrls: ['./customizer.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CustomizerComponent {
  options = this.settings.getOptions();

  @Output() optionsChange = new EventEmitter<AppSettings>();
  hideSingleSelectionIndicator = signal(true);

  constructor(private settings: CoreService) {}
  setDark() {
    this.settings.setOptions({ theme: 'dark' });
    this.emitOptions();
  }

  setColor(color: string) {
    this.settings.setOptions({ activeTheme: color });
    this.emitOptions();
  }

  setDir(dir: 'ltr' | 'rtl') {
    this.settings.setOptions({ dir: dir });
    this.emitOptions();
  }

  setSidebar(sidenavOpened: boolean) {
    this.settings.setOptions({ sidenavOpened: sidenavOpened });
    this.emitOptions();
  }

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }
}
