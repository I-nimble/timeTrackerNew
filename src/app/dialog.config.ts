import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import { Provider } from '@angular/core';

export const dialogProviders: Provider[] = [
  {
    provide: MAT_DIALOG_DEFAULT_OPTIONS,
    useValue: {
      hasBackdrop: true,
      disableClose: true
    } as MatDialogConfig
  }
];
