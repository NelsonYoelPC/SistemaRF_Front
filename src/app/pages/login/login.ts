import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { getSidebarByRole } from '../../core/data/sidebar.menu';
import { UserRole } from '../../core/types/user-role.type';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loading = false;
  errorMessage = '';
  showPassword = false;
  rememberMe = false;
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    this.loadRememberedUser();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    if (this.rememberMe) {
      localStorage.setItem('rememberedUser', this.form.get('name')?.value ?? '');
    } else {
      localStorage.removeItem('rememberedUser');
    }

    this.authService.login(this.form.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          const role = response.data.user.role as UserRole;
          let targetRoute = this.resolveLandingRoute(role);

          if (targetRoute && !targetRoute.startsWith('/app')) {
            targetRoute = `/app${targetRoute.startsWith('/') ? '' : '/'}${targetRoute}`;
          }
          
          console.log('Navegando a ruta de aterrizaje:', targetRoute);
          this.router.navigateByUrl(targetRoute);
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message ||
            error?.error?.errors?.name?.[0] ||
            'No se pudo iniciar sesión. Verifica tus credenciales.';
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleRememberMe(): void {
    this.rememberMe = !this.rememberMe;

    if (!this.rememberMe) {
      localStorage.removeItem('rememberedUser');
    }
  }

  private loadRememberedUser(): void {
    const rememberedUser = localStorage.getItem('rememberedUser');

    if (rememberedUser) {
      this.form.patchValue({ name: rememberedUser });
      this.rememberMe = true;
    }
  }

  private resolveLandingRoute(role: UserRole): string {
    const groups = getSidebarByRole(role);

    for (const group of groups) {
      for (const item of group.items) {
        if (item.route && item.route !== '/logout') {
          return item.route;
        }

        if (item.children?.length) {
          const child = item.children.find((x) => !!x.route && x.route !== '/logout');
          if (child?.route) {
            return child.route;
          }
        }
      }
    }

    return '/';
  }
}