import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'AdminMaster';
  isAppReady = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('[AppComponent] ngOnInit');
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        console.log('[AppComponent] NavigationEnd:', event);
        this.isAppReady = true;
      });
  }
}
