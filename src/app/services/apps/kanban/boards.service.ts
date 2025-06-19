import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getBoardWithTasks(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/tasks/${id}`);
  }
  
  createBoard(board: any): Observable<any> {
    return this.http.post<any>(this.API_URI, board);
  }
  
  updateBoard(id: number, board: any): Observable<any> {
    return this.http.put<any>(`${this.API_URI}/${id}`, board);
  }

  updateTask(taskId: number, data: any): Observable<any> {
  return this.http.put<any>(`${this.API_URI}/update-task/${taskId}`, data);
  }

  deleteBoard(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URI}/${id}`);
  }

  addTaskToBoard(task: any): Observable<any> {
    return this.http.post<any>(`${this.API_URI}/add-task`, task);
  }

  removeTaskFromBoard(task: any): Observable<any> {
    return this.http.post<any>(`${this.API_URI}/remove-task`, task);
  }
}