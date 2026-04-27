import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';

import { TablerIconsModule } from 'angular-tabler-icons';
import { blogService } from 'src/app/services/apps/blog/blog.service';

@Component({
  selector: 'app-blogs',
  imports: [MatCardModule, TablerIconsModule, MatChipsModule],
  templateUrl: './blogs.component.html',
})
export class AppBlogsComponent implements OnInit {
  posts = this.blogService.getBlog();

  constructor(
    public router: Router,
    public blogService: blogService,
  ) {}

  selectBlog(title: string) {
    this.blogService.selectBlogPost(title);
    this.router.navigate(['apps/blog/detail', title]);
  }
  ngOnInit(): void {
    console.log('Blog posts loaded:', this.posts);
  }
}
