import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  UsuarioListadoApi,
  UsuariosApiService
} from '../../core/services/usuarios-api.service';

interface UsuarioListado {
  usuario_id: number;
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string | null;
  cargo: string | null;
  estado_usuario: boolean;
  user_id: number | null;
  username: string | null;
  email: string | null;
  rol_codigo: string | null;
  rol_descripcion: string | null;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  showUsuarioModal = false;

  usuarioForm!: FormGroup;
  formSubmitted = false;
  savingUsuario = false;
  loadingUsuarios = false;
  saveError = '';
  loadError = '';

  usuarios: UsuarioListado[] = [];

  filtroBusqueda = '';
  filtroEstado = '';
  filtroAcceso = '';
  filtroRol = '';

  currentPage = 1;
  pageSize = 3;

  tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carné de extranjería' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
  ];

  roles = [
    { value: 1, codigo: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 2, codigo: 'JEFE_SEGURIDAD', label: 'Jefe de Seguridad' },
    { value: 3, codigo: 'ANALISTA_SEGURIDAD', label: 'Analista de Seguridad' }
  ];

  selectedPhotoName = '';
  selectedPhotoFile: File | null = null;
  photoPreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private usuariosApiService: UsuariosApiService
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.configureAccessSection();
    this.loadUsuarios();
  }

  get tieneAcceso(): boolean {
    return this.usuarioForm.get('tiene_acceso')?.value === true;
  }

  private filtrarUsuarios(): UsuarioListado[] {
    const texto = (this.filtroBusqueda || '').trim().toLowerCase();

    return this.usuarios.filter((usuario) => {
      const cumpleBusqueda =
        !texto ||
        usuario.nombre_completo.toLowerCase().includes(texto) ||
        usuario.numero_documento.toLowerCase().includes(texto) ||
        (usuario.username ?? '').toLowerCase().includes(texto) ||
        (usuario.email ?? '').toLowerCase().includes(texto);

      const cumpleEstado =
        this.filtroEstado === '' ||
        String(Number(usuario.estado_usuario)) === this.filtroEstado;

      const tieneAcceso = usuario.user_id !== null;

      const cumpleAcceso =
        this.filtroAcceso === '' ||
        String(Number(tieneAcceso)) === this.filtroAcceso;

      const cumpleRol =
        this.filtroRol === '' ||
        usuario.rol_codigo === this.filtroRol;

      return cumpleBusqueda && cumpleEstado && cumpleAcceso && cumpleRol;
    });
  }

  get usuariosFiltrados(): UsuarioListado[] {
    return this.filtrarUsuarios();
  }

  get totalUsuarios(): number {
    return this.usuariosFiltrados.length;
  }

  get totalPages(): number {
    return this.totalUsuarios === 0
      ? 0
      : Math.ceil(this.totalUsuarios / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get usuariosPaginados(): UsuarioListado[] {
    const filtrados = this.usuariosFiltrados;

    if (filtrados.length === 0) {
      return [];
    }

    const paginaActual = Math.min(this.currentPage, this.totalPages || 1);
    const startIndex = (paginaActual - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    return filtrados.slice(startIndex, endIndex);
  }

  buildForm(): void {
    this.usuarioForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellido_paterno: ['', [Validators.required, Validators.maxLength(100)]],
      apellido_materno: ['', [Validators.maxLength(100)]],
      tipo_documento: ['', [Validators.required]],
      numero_documento: ['', [Validators.required, Validators.maxLength(20)]],
      telefono: ['', [Validators.maxLength(20)]],
      direccion: ['', [Validators.maxLength(200)]],
      cargo: ['', [Validators.maxLength(100)]],
      estado: [true, [Validators.required]],

      tiene_acceso: [false],
      username: [{ value: '', disabled: true }, [Validators.maxLength(50)]],
      email: [{ value: '', disabled: true }, [Validators.email, Validators.maxLength(150)]],
      password: [{ value: '', disabled: true }, [Validators.minLength(8), Validators.maxLength(100)]],
      role_id: [{ value: '', disabled: true }]
    });
  }

  configureAccessSection(): void {
    this.usuarioForm.get('tiene_acceso')?.valueChanges.subscribe((enabled: boolean) => {
      const usernameControl = this.usuarioForm.get('username');
      const emailControl = this.usuarioForm.get('email');
      const passwordControl = this.usuarioForm.get('password');
      const roleControl = this.usuarioForm.get('role_id');

      if (enabled) {
        usernameControl?.enable({ emitEvent: false });
        emailControl?.enable({ emitEvent: false });
        passwordControl?.enable({ emitEvent: false });
        roleControl?.enable({ emitEvent: false });

        usernameControl?.setValidators([Validators.required, Validators.maxLength(50)]);
        emailControl?.setValidators([Validators.required, Validators.email, Validators.maxLength(150)]);
        passwordControl?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(100)]);
        roleControl?.setValidators([Validators.required]);
      } else {
        usernameControl?.reset('', { emitEvent: false });
        emailControl?.reset('', { emitEvent: false });
        passwordControl?.reset('', { emitEvent: false });
        roleControl?.reset('', { emitEvent: false });

        usernameControl?.clearValidators();
        emailControl?.clearValidators();
        passwordControl?.clearValidators();
        roleControl?.clearValidators();

        usernameControl?.disable({ emitEvent: false });
        emailControl?.disable({ emitEvent: false });
        passwordControl?.disable({ emitEvent: false });
        roleControl?.disable({ emitEvent: false });
      }

      usernameControl?.updateValueAndValidity({ emitEvent: false });
      emailControl?.updateValueAndValidity({ emitEvent: false });
      passwordControl?.updateValueAndValidity({ emitEvent: false });
      roleControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  loadUsuarios(): void {
    this.loadingUsuarios = true;
    this.loadError = '';

    this.usuariosApiService.getAll().subscribe({
      next: (response: UsuarioListadoApi[]) => {
        const data = Array.isArray(response) ? response : [];

        this.usuarios = data.map((item) => ({
          ...item,
          estado_usuario: item.estado_usuario === true || Number(item.estado_usuario) === 1
        }));

        this.currentPage = 1;
        this.loadingUsuarios = false;
      },
      error: (error) => {
        this.loadingUsuarios = false;
        this.loadError = 'No se pudo cargar el listado de usuarios.';
        console.error('Error al cargar usuarios', error);
        this.usuarios = [];
        this.currentPage = 1;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  clearFilters(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = '';
    this.filtroAcceso = '';
    this.filtroRol = '';
    this.currentPage = 1;
  }

  openUsuarioModal(): void {
    this.formSubmitted = false;
    this.saveError = '';
    this.resetForm();
    this.showUsuarioModal = true;
  }

  closeUsuarioModal(): void {
    this.showUsuarioModal = false;
    this.formSubmitted = false;
    this.saveError = '';
    this.resetForm();
  }

  resetForm(): void {
    this.usuarioForm.reset({
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      tipo_documento: '',
      numero_documento: '',
      telefono: '',
      direccion: '',
      cargo: '',
      estado: true,
      tiene_acceso: false,
      username: '',
      email: '',
      password: '',
      role_id: ''
    });

    this.selectedPhotoName = '';
    this.selectedPhotoFile = null;
    this.photoPreviewUrl = null;

    this.usuarioForm.markAsPristine();
    this.usuarioForm.markAsUntouched();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.selectedPhotoName = '';
      this.selectedPhotoFile = null;
      this.photoPreviewUrl = null;
      return;
    }

    this.selectedPhotoName = file.name;
    this.selectedPhotoFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  saveUsuario(): void {
    this.formSubmitted = true;
    this.saveError = '';

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const raw = this.usuarioForm.getRawValue();
    const formData = new FormData();

    formData.append('nombres', raw.nombres);
    formData.append('apellido_paterno', raw.apellido_paterno);
    formData.append('apellido_materno', raw.apellido_materno || '');
    formData.append('tipo_documento', raw.tipo_documento);
    formData.append('numero_documento', raw.numero_documento);
    formData.append('telefono', raw.telefono || '');
    formData.append('direccion', raw.direccion || '');
    formData.append('cargo', raw.cargo || '');
    formData.append('estado', raw.estado ? '1' : '0');
    formData.append('tiene_acceso', raw.tiene_acceso ? '1' : '0');

    if (raw.tiene_acceso) {
      formData.append('username', raw.username);
      formData.append('email', raw.email);
      formData.append('password', raw.password);
      formData.append('role_id', String(raw.role_id));
    }

    if (this.selectedPhotoFile) {
      formData.append('foto_principal', this.selectedPhotoFile);
    }

    this.savingUsuario = true;

    this.usuariosApiService.create(formData).subscribe({
      next: (response) => {
        console.log('Usuario guardado:', response);
        this.savingUsuario = false;
        this.closeUsuarioModal();
        this.loadUsuarios();
      },
      error: (error) => {
        this.savingUsuario = false;
        console.error('Error al guardar usuario', error);
        this.saveError =
          error?.error?.message ||
          'Ocurrió un error al registrar el usuario.';
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.usuarioForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.formSubmitted);
  }

  getDocumento(usuario: UsuarioListado): string {
    return `${usuario.numero_documento}`;
  }

  getEstadoLabel(estado: boolean): string {
    return estado ? 'Activo' : 'Inactivo';
  }

  toggleEstado(usuario: UsuarioListado): void {
    usuario.estado_usuario = !usuario.estado_usuario;
  }

  editarUsuario(usuario: UsuarioListado): void {
    console.log('Editar usuario:', usuario);
    this.openUsuarioModal();
  }

  verUsuario(usuario: UsuarioListado): void {
    console.log('Ver usuario:', usuario);
  }
}

