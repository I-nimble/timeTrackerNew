import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, map, forkJoin, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BoardsService {
  private API_URI = environment.apiUrl + '/boards';

  constructor(private http: HttpClient) {}

  getBoards(): Observable<any> {
    return this.http.get<any>(this.API_URI);
  }

  getAllBoardsTasks(): Observable<any> {
  return this.http.get<any>(`${this.API_URI}/all-tasks`);
  }

  getBoardById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }

  getBoardWithTasks(id: number, days?: number): Observable<any> {
    if(days) return this.http.get<any>(`${this.API_URI}/tasks/${id}/${days}`);
    return this.http.get<any>(`${this.API_URI}/tasks/${id}`);
  }
  
  createBoard(board: any): Observable<any> {
    return this.http.post<any>(this.API_URI, board);
  }
  
  updateBoard(id: number, board: any): Observable<any> {
    return this.http.put<any>(`${this.API_URI}/${id}`, board);
  }
  
  deleteBoard(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URI}/${id}`);
  }
  
  private uploadTaskAttachments(files: File[]): Observable<any[]> {
    if (!files || files.length === 0) return of([]);
    // For each file, get upload URL and upload
    const uploads$ = files.map(file => {
      let contentType = file.type;
      if (!contentType || file.name.endsWith('.rar')) {
        contentType = 'application/x-rar-compressed';
      }
      return this.http.get<any>(`${environment.apiUrl}/generate_upload_url/task_attachments`).pipe(
        switchMap((uploadUrlRes: any) => {
          const uploadUrl = uploadUrlRes.url;
          const headers = new HttpHeaders({ 'Content-Type': contentType });
          return this.http.put(uploadUrl, file, { headers }).pipe(
            map(() => {
              const urlParts = uploadUrl.split('?')[0].split('/');
              const s3_filename = urlParts[urlParts.length - 1];
              return {
                s3_filename,
                file_name: file.name,
                file_type: contentType,
                file_size: file.size,
              };
            })
          );
        })
      );
    });
    return forkJoin(uploads$);
  }

  addTaskToBoard(task: any): Observable<any> {
    // If there are files to upload, handle them first
    const files: File[] = Array.isArray(task.task_attachments) ? task.task_attachments.filter((f:any) => f instanceof File) : [];
    return this.uploadTaskAttachments(files).pipe(
      switchMap((uploadedFiles) => {
        const taskData = {
          ...task,
          task_attachments: uploadedFiles
        };
        return this.http.post<any>(`${this.API_URI}/add-task`, taskData);
      })
    );
  }

  updateTask(taskId: number, data: any): Observable<any> {
    const files: File[] = Array.isArray(data.task_attachments) ? data.task_attachments.filter((f:any) => f instanceof File) : [];
    const previousAttachments: any[] = Array.isArray(data.task_attachments) ? data.task_attachments.filter((f:any) => !(f instanceof File)) : [];
    return this.uploadTaskAttachments(files).pipe(
      switchMap((uploadedFiles) => {
        const taskData = {
          ...data,
          task_attachments: uploadedFiles.concat(previousAttachments)
        };
        return this.http.put<any>(`${this.API_URI}/update-task/${taskId}`, taskData);
      })
    );
  }

  removeTaskFromBoard(task: any): Observable<any> {
    return this.http.post<any>(`${this.API_URI}/remove-task`, task);
  }

  createColumn(boardId: number, column: any): Observable<any> {
  return this.http.post<any>(`${this.API_URI}/columns`, {
    ...column,
    board_id: boardId
  });
}

updateColumn(columnId: number, column: any): Observable<any> {
  return this.http.put<any>(`${this.API_URI}/columns/${columnId}`, column);
}
}