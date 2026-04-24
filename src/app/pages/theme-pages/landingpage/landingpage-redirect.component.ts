import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-landingpage-redirect',
  standalone: true,
  template: '',
})
export class LandingPageRedirectComponent implements OnInit {
  ngOnInit(): void {
    window.location.href = 'https://i-nimble.com/';
  }
}
