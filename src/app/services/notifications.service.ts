import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NotificationsPopupComponent } from '../components/notifications-popup/notifications-popup.component';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { notificationCategory, Notification } from '../models/Notifications';


@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  notificationCategories: notificationCategory[] = [
    {
      id: 6,
      name: 'Job application',
      icon: 'fa-solid fa-briefcase',
      color: '#b54343',
      notifications: []
    },
    {
      id: 1,
      name: 'Notification',
      icon: 'fa-solid fa-circle-info',
      color: '#92b46c',
      notifications: []
    },
    {
      id: 2,
      name: 'Reminder',
      icon: 'fa-solid fa-bell',
      color: '#d0bf45',
      notifications: []
    },
    {
      id: 3,
      name: 'Message',
      icon: 'fa-solid fa-envelope',
      color: '#92b46c',
      notifications: []
    },
    {
      id: 4,
      name: 'Lateness alert',
      icon: 'fa-solid fa-clock',
      color: '#d0bf45',
      notifications: []
    },
    {
      id: 5,
      name: 'Leave request',
      icon: 'fa-solid fa-calendar-check',
      color: '#d0bf45',
      notifications: []
    },
  ]
  API_URI = `${environment.apiUrl}/notifications`;
  notifications: { recent: notificationCategory[], earlier: notificationCategory[] } = {
    recent: [],
    earlier: []
  };
  recentNotifications: Notification[] = [];
  earlierNotifications: Notification[] = [];
  ToDoNotificationSent: boolean = false;

  constructor(private http: HttpClient,
              private router: Router,
              private dialog: MatDialog,
              private sanitizer: DomSanitizer) { }

  get() {
    return this.http.get<any>(`${this.API_URI}`);
  }

  public getAll() {
    return this.http.post(`${this.API_URI}/all`, {});
  }

  getById(id:number) {
    return this.http.post<any>(`${this.API_URI}/${id}`, {});
  }

  public submit(data: any, id: any = null) {
    let form = new FormData();
    if (data.id) form.append('id', data.id);
    if (data.cv) form.append('cv', data.cv);
    if (data.message) form.append('message', data.message);
    if (data.type_id) form.append('type_id', data.type_id);
    if (data.selectedUsers) form.append('selectedUsers', JSON.stringify(data.selectedUsers));

    if (id) return this.http.put(`${this.API_URI}/${id}`, form);
    return this.http.post(`${this.API_URI}`, form);
  }

  rememberToDo(data: any) {
    return this.http.post(`${this.API_URI}/to-do`, data);
  }

  update(notifications: Notification[], status: number) {
    if(notifications.length > 0) {
      const promises = notifications.map((notification: any) => {
        if(notification.users_notifications) {
          if(notification.users_notifications.user_id && notification.id) {
            const now = new Date();
            const body:any = {
              "user_id": notification.users_notifications.user_id,
              "notification_id": notification.id,
              "status": status,
              "updatedAt": now
            }
          
            return this.http.put(`${this.API_URI}/${notification.id}/${notification.users_notifications.user_id}`, body)
            .subscribe({
              next: (response) => {
                this.loadNotifications()
              }
            });
          }
          return
        }
        else {
          return
        }
      });
    }
  }

  delete(id:number) {
    return this.http.delete<any>(`${this.API_URI}/${id}`, {});
  }

  loadNotifications() {
    this.get().subscribe({
      next: (notifications: Notification[]) => {
        if (notifications.length > 0) {
          notifications.sort((a, b) => {            
            return (b.type_id == 6) ? 1 : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          });
          const today = new Date();
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(today.getDate() - 2);
  
          let recentNotifications: notificationCategory[] = this.notificationCategories.map(category => ({
            ...category,
            notifications: []
          }));
          let earlierNotifications: notificationCategory[] = this.notificationCategories.map(category => ({
            ...category,
            notifications: []
          }));
          this.recentNotifications = [];
          this.earlierNotifications = [];
  
          notifications.forEach(notification => {
            const category = this.notificationCategories.find(cat => cat.id === notification.type_id);
            if (category) {
              if (new Date(notification.createdAt) >= twoDaysAgo && new Date(notification.createdAt) <= today && 
                notification.users_notifications.status !== 2 && notification.users_notifications.status !== 5) {
                  
                recentNotifications.find(cat => cat.id === category.id)?.notifications.push(notification);
                this.recentNotifications.push(notification);
              } else {
                earlierNotifications.find(cat => cat.id === category.id)?.notifications.push(notification);
                this.earlierNotifications.push(notification);
              }
            }
          });
  
          recentNotifications = recentNotifications.filter(category => category.notifications.length > 0);
          earlierNotifications = earlierNotifications.filter(category => category.notifications.length > 0);

          this.notifications = {
            recent: recentNotifications,
            earlier: earlierNotifications
          };
  
          if (this.notifications.recent.some(category => category.notifications.length > 0)) {
            const dialogId = 'notificationsPopup';
            const existingDialog = this.dialog.getDialogById(dialogId);
  
            if (!existingDialog) {
              this.dialog.open(NotificationsPopupComponent, { id: dialogId });
            }
          }
        }
      }
    });
  }

  clearNotifications() {
    this.notifications.recent = [];
    this.notifications.earlier = [];
    this.recentNotifications = [];
    this.earlierNotifications = [];
  }

  public getResume(applicationId?: number): Observable<{ url: SafeResourceUrl | null, extension: string | null }> {
    const headers = new HttpHeaders({ Accept: 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const options = { headers: headers, responseType: 'blob' as 'json' };
  
    return this.http.post<Blob>(`${this.API_URI}/resume`, { applicationId }, options).pipe(
      switchMap((response: Blob) => {
        if (response.type === 'application/json') {
          return new Observable<{ url: SafeResourceUrl | null, extension: string | null }>((observer) => {
            const reader = new FileReader();
            reader.onload = () => {
              const responseText = reader.result as string;
              if (responseText.includes('Resume does not exist')) {
                console.warn('No resume available: ', responseText);
                observer.next({ url: null, extension: null });  
              }
              observer.complete(); 
            };
            reader.onerror = (error) => {
              observer.error(error); 
            };
            reader.readAsText(response); 
          });
        }

        const url = URL.createObjectURL(response);
        const safeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        const extension = response.type === 'application/pdf' ? 'pdf' : 'docx';
        return of({ url: safeUrl, extension: extension }); 
      }),
      catchError((error) => {
        console.error('Error fetching resume:', error);
        return of({ url: null, extension: null });  
      })
    );
  }
}