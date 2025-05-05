import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Entries } from '../models/Entries';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsersService } from 'src/app/services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationsPopupComponent } from '../components/notifications-popup/notifications-popup.component';

@Injectable({
  providedIn: 'root',
})
export class EntriesService {
  userService = inject(UsersService);
  API_URI = environment.apiUrl;
  reviewEntries: any = [];

  constructor(private http: HttpClient, private dialog:MatDialog) {}
  getEntries() {
    return this.http.get<any>(`${this.API_URI}/entries`);
  }
  getAllEntries(data: any) {
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.post<any>(`${this.API_URI}/entries`, data, {
      headers,
    });
  }
  updateEntryTask(id: string, data: any) {
    return this.http.put<any>(`${this.API_URI}/entries/task/${id}`, data);
  }

  getUsersEntries(user_id: any) {
    return this.http.post<any>(`${this.API_URI}/entries/user`, user_id);
  }

  createEntry(entry: any) {
    const jwt = localStorage.getItem('jwt');
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.post(`${this.API_URI}/entries/add`, entry);
  }
  deleteEntry(id: number) {
    return this.http.delete(`${this.API_URI}/entries/${id}`);
  }
  cancelEntry(id: number) {
    return this.http.delete(`${this.API_URI}/entries/cancel/${id}`);
  }
  closeCurrentEntry(entry: any) {
    return this.http.put(`${this.API_URI}/entries/closeEntry/${entry.id}`, entry);
  }
  updateEntry(id: number, updatedEntry: Entries): Observable<Entries> {
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.put<Entries>(
      `${this.API_URI}/entries/${id}`,
      updatedEntry,
      { headers }
    );
  }

  loadEntries(showPopup:boolean = true) {
    let body = {};
    const userType = localStorage.getItem('role')
    if(userType) {
      if(userType !== '1'){
        this.reviewEntries = [];
      } else {
        this.userService.getUsers(body).subscribe({
          next: (users) => {
            this.reviewEntries = users.filter((user: any) => user.review);
            this.reviewEntries = this.reviewEntries.map((user: any) => {
              return {
                message: `Entries For Review: ${user.name} ${user.last_name}`,
                id: user.id,
                name: user.name
              };
            });   
            if(this.reviewEntries.length > 0 && showPopup) {
              const dialogId = 'notificationsPopup';
              const existingDialog = this.dialog.getDialogById(dialogId);
  
              if (!existingDialog) {
                const dialogRef = this.dialog.open(NotificationsPopupComponent, {
                    id: dialogId,
                });
              }
            }
          }
        });
      }
    }
  }
}
