import { Provider } from '@angular/core';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialogConfig,
} from '@angular/material/dialog';

export const dialogProviders: Provider[] = [
  {
    provide: MAT_DIALOG_DEFAULT_OPTIONS,
    useValue: {
      hasBackdrop: true,
      disableClose: true,
    } as MatDialogConfig,
  },
];
