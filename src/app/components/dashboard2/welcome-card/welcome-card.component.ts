import { Component, Inject } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { UsersService } from '../../../services/users.service'

@Component({
  selector: 'app-welcome-card',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './welcome-card.component.html',
})
export class AppWelcomeCardComponent {
  userName: string = '';

  constructor(@Inject(UsersService) private usersService: UsersService) {}

  ngOnInit(): void {
    this.usersService.getUsername().subscribe({
      next: (userName) => {
        this.userName = userName || '';
      },
      error: (error) => {
        console.error('Error fetching username:', error);
      }
    });
  }
}