import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor(private snackBar: MatSnackBar) { }

  async downloadFile(blob: Blob, filename: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
      const reader = new FileReader();
      const base64WithHeader = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const base64Data = base64WithHeader.split(',')[1];

      await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
      });

        this.snackBar.open(`File saved to Documents: ${filename}`, 'Close', {
          duration: 3000,
        });
      } catch (error) {
        console.error('Error saving file on mobile:', error);
        this.snackBar.open('Error saving file', 'Close', {
          duration: 3000,
        });
      }
    } else {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }
}