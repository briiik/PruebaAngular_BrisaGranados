import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario = '';
  password = '';
  error = false;

  private credenciales = { usuario: 'admin', password: 'Admin@12345' };

  constructor(private router: Router) {}

  login() {
    if (this.usuario === this.credenciales.usuario && this.password === this.credenciales.password) {
      this.error = false;
      this.router.navigate(['/']);
    } else {
      this.error = true;
    }
  }
}