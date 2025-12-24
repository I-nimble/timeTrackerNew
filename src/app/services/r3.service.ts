import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class R3Service {
  private API_URI = `${environment.apiUrl}/r3`;
  private r3StateSubject = new BehaviorSubject<any>(null);
  r3State$ = this.r3StateSubject.asObservable();

  constructor(private http: HttpClient) {}
  getR3Module() {
    return this.http.get(`${this.API_URI}`).pipe(
      tap((data: any) => this.r3StateSubject.next(data)),
      catchError(err => {
        console.error('Error fetching R3 module', err);
        return of(null);
      })
    );
  }

  saveVision(visions: any[], deleted_vision_ids: any[] = [], deleted_vision_item_ids: any[] = []) {
    return this.http.post(`${this.API_URI}/vision`, {
      visions,
      deleted_vision_ids,
      deleted_vision_item_ids
    }).pipe(
      tap(() => this.getR3Module().subscribe()),
      catchError(err => {
        console.error('Error saving Vision module', err);
        return of(null);
      })
    );
  }

  getVisionItemUploadUrl(fileType: string, originalFileName: string) {
    return this.http.get<{ uploadURL: string; key: string; fileName: string }>(
      `${this.API_URI}/vision/upload-url`,
      {
        params: { fileType, originalFileName },
      }
    );
  }

  uploadFileToS3(file: File, uploadURL: string, fileName?: string) {
    const headers: { [key: string]: string } = { 'Content-Type': file.type };
    if (fileName) {
      headers['X-Filename'] = fileName;
    }
    return this.http.put(uploadURL, file, {
      headers,
      responseType: 'text',
    });
  }

  uploadVisionItem(file: File) {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<{ key: string }>(`${this.API_URI}/vision/upload`, form).pipe(
      tap(() => this.getR3Module().subscribe()),
      catchError(err => {
        console.error('Error uploading vision item', err);
        return of(null);
      })
    );
  }

  saveTraction(payload: any) {
    return this.http.post(`${this.API_URI}/traction`, payload).pipe(
      tap(() => this.getR3Module().subscribe()),
      catchError(err => {
        console.error('Error saving Traction module', err);
        return of(null);
      })
    );
  }

  saveAction(
    rocks: any[],
    deleted_rock_ids: any[] = [],
    deleted_rock_item_ids: any[] = []
  ) {
    return this.http.post(`${this.API_URI}/action`, {
      rocks,
      deleted_rock_ids,
      deleted_rock_item_ids
    }).pipe(
      tap(() => this.getR3Module().subscribe()),
      catchError(err => {
        console.error('Error saving Action module', err);
        return of(null);
      })
    );
  }
}