import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        --app-scale: 0.9;
        zoom: var(--app-scale);
        background: #f1f5f9;
        overflow-y: auto;
        overflow-x: hidden;
      }
    `
  ]
})
export class AuthLayoutComponent {}
