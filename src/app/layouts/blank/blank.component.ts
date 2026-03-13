import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: [],
  imports: [RouterOutlet, MaterialModule, CommonModule],
})
export class BlankComponent {
  options = this.settings.getOptions();

  constructor(private settings: CoreService, private themeService: ThemeService) {
    // Initialize project theme with options
    this.receiveOptions(this.options);
  }

  receiveOptions(options: AppSettings): void {
    this.themeService.applyThemeFromOptions(options);
    this.themeService.applyColorTheme(options.activeTheme);
  }

  toggleDarkTheme(options: AppSettings) {
    this.themeService.applyThemeFromOptions(options);
  }

  toggleColorsTheme(options: AppSettings) {
    this.themeService.applyColorTheme(options.activeTheme);
  }
}
