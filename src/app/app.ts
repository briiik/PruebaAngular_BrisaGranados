import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, 
  MenuModule,],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  
})
export class AppComponent {
  title = 'mi-proyecto';
}