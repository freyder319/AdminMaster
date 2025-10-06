import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-reset-password',
  imports: [NgClass],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {

  showPassword = false;
  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

}
