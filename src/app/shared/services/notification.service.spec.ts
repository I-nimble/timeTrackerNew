import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', [
      'open',
      'dismiss',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: snackBarSpy }],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('success() should delegate to MatSnackBar.open', () => {
    service.success('Saved');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Saved',
      'Close',
      jasmine.objectContaining({
        duration: 6000,
        horizontalPosition: 'center',
        panelClass: ['app-snackbar-success'],
        verticalPosition: 'top',
      }),
    );
  });

  it('error() should delegate to MatSnackBar.open', () => {
    service.error('Oops');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Oops',
      'Close',
      jasmine.objectContaining({
        duration: 6000,
        horizontalPosition: 'center',
        panelClass: ['app-snackbar-error'],
        verticalPosition: 'top',
      }),
    );
  });

  it('warning() should delegate to MatSnackBar.open', () => {
    service.warning('Careful');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Careful',
      'Close',
      jasmine.objectContaining({
        duration: 6000,
        horizontalPosition: 'center',
        panelClass: ['app-snackbar-warning'],
        verticalPosition: 'top',
      }),
    );
  });

  it('info() should delegate to MatSnackBar.open', () => {
    service.info('FYI');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'FYI',
      'Close',
      jasmine.objectContaining({
        duration: 6000,
        horizontalPosition: 'center',
        panelClass: ['app-snackbar-info'],
        verticalPosition: 'top',
      }),
    );
  });

  it('dismissAll() should call MatSnackBar.dismiss', () => {
    service.dismissAll();
    expect(snackBarSpy.dismiss).toHaveBeenCalled();
  });

  it('should preserve explicit config overrides', () => {
    service.success('Done', { duration: 1000, panelClass: 'custom' });
    const args = snackBarSpy.open.calls.mostRecent().args;
    expect(args[0]).toBe('Done');
    expect(args[1]).toBe('Close');
    expect(args[2]).toEqual(
      jasmine.objectContaining({
        duration: 1000,
        panelClass: ['custom', 'app-snackbar-success'],
      }),
    );
  });
});
