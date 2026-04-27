import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';

import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { AppCodeViewComponent } from 'src/app/components/code-view/code-view.component';

// snippets
import {
  BASIC_SLIDER_HTML_SNIPPET,
  CONFIGURATION_SLIDER_HTML_SNIPPET,
  CUSTOM_THUMB_LABEL_SLIDER_HTML_SNIPPET,
  RANGE_SLIDER_HTML_SNIPPET,
} from './code/slider-html-snippet';
import {
  BASIC_SLIDER_TS_SNIPPET,
  CONFIGURATION_SLIDER_TS_SNIPPET,
  CUSTOM_THUMB_LABEL_SLIDER_TS_SNIPPET,
} from './code/slider-ts-snippet';

@Component({
  selector: 'app-slider',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCheckboxModule,
    MatSliderModule,
    Highlight,
    HighlightAuto,
    HighlightLineNumbers,
    AppCodeViewComponent,
  ],
  templateUrl: './slider.component.html',
})
export class AppSliderComponent implements OnInit {
  // 1 [Configuration with Slider]
  codeForSliderConfiguration = CONFIGURATION_SLIDER_HTML_SNIPPET;
  codeForSliderConfigurationTs = CONFIGURATION_SLIDER_TS_SNIPPET;

  // 2 [custom thumb label with Slider]
  codeForSliderCustomThumbLabel = CUSTOM_THUMB_LABEL_SLIDER_HTML_SNIPPET;
  codeForSliderCustomThumbLabelTs = CUSTOM_THUMB_LABEL_SLIDER_TS_SNIPPET;

  // 3 [basic with Slider]
  codeForSliderBasic = BASIC_SLIDER_HTML_SNIPPET;
  codeForSliderBasicTs = BASIC_SLIDER_TS_SNIPPET;

  // 4 [Range slider with Slider]
  codeForSliderRange = RANGE_SLIDER_HTML_SNIPPET;
  codeForSliderRangeTs = BASIC_SLIDER_TS_SNIPPET;

  disabled = false;
  max = 100;
  min = 0;
  showTicks = false;
  step = 1;
  thumbLabel = false;
  value = 0;

  // 2
  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }

  constructor() {}

  ngOnInit(): void {}
}
