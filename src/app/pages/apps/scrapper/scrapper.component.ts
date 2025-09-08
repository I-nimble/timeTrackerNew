import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { ScrapperTableComponent } from './scrapper-table/scrapper-table.component';
import { ScrapperService } from 'src/app/services/apps/scrapper/scrapper.service';

@Component({
  selector: 'app-scrapper',
  templateUrl: './scrapper.component.html',
  styleUrls: ['./scrapper.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ScrapperTableComponent
  ]
})
export class ScrapperComponent implements OnInit {
  posts: any = [];

  constructor (private scrapperService: ScrapperService){
  }

  ngOnInit(): void {
    this.getPosts()
  }
  
  getPosts() {
    this.scrapperService.getPosts().subscribe(posts => {
      this.posts = posts;
    })
  }
}