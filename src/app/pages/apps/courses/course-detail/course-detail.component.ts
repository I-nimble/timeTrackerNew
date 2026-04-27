import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { TablerIconsModule } from 'angular-tabler-icons';
import { CourseService } from 'src/app/services/apps/course/course.service';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  imports: [
    MatCardModule,
    TablerIconsModule,
    MatStepperModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class AppCourseDetailComponent {
  id = signal<any>(null);
  courseDetail = signal<any>(null);

  constructor(
    activatedRouter: ActivatedRoute,
    public courseService: CourseService,
    private router: Router,
  ) {
    this.id.set(activatedRouter?.snapshot?.paramMap?.get('id'));

    const courses = this.courseService.getCourse();
    this.courseDetail.set(courses.filter((x) => x?.Id === +this.id())[0]);
  }

  goBack(): void {
    this.router.navigate(['/apps/courses']);
  }
}
