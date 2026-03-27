import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import {
  UsuarioListadoApi,
  UsuariosApiService
} from '../../core/services/usuarios-api.service';

/* =========================================================
   INTERFAZ DEL LISTADO DE USUARIOS
   - Representa la estructura devuelta por el endpoint de consulta
   ========================================================= */
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

/* =========================================================
   INTERFAZ DE FOTOS DEL USUARIO
   - Cada foto mantiene su propio zoom y desplazamiento
   ========================================================= */
interface UsuarioFoto {
  name: string;
  file: File;
  previewUrl: string;
  adjustedBase64: string | null;
  scale: number;
  offsetX: number;
  offsetY: number;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  /* =========================================================
     ESTADO GENERAL DE LA PANTALLA
     ========================================================= */
  totalUsuarios = 0;
  showUsuarioModal = false;

  usuarioForm!: FormGroup;
  formSubmitted = false;
  savingUsuario = false;
  loadingUsuarios = false;
  saveError = '';
  loadError = '';

  /* =========================================================
     LISTADO, FILTROS Y PAGINACIÓN
     ========================================================= */
  usuarios: UsuarioListado[] = [];
  usuariosFiltrados: UsuarioListado[] = [];
  usuariosPaginados: UsuarioListado[] = [];

  filtroBusqueda = '';
  filtroEstado = '';
  filtroAcceso = '';
  filtroRol = '';

  currentPage = 1;
  pageSize = 3;
  totalPages = 0;

  /* =========================================================
     CATÁLOGOS DEL FORMULARIO
     ========================================================= */
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

  /* =========================================================
     SECCIÓN DESPLEGABLE: ACCESO AL SISTEMA
     ========================================================= */
  showAccesoSection = false;

  /* =========================================================
     FOTOS DEL USUARIO
     - Hasta 4 fotos
     - Se edita una foto activa a la vez
     - La vista previa final sigue dentro de 450x450
     ========================================================= */
  readonly maxPhotos = 4;
  readonly photoSize = 450;

  usuarioFotos: UsuarioFoto[] = [];
  activePhotoIndex = 0;

  /* =========================================================
     DRAG DE LA FOTO ACTIVA DENTRO DEL MARCO
     ========================================================= */
  isDraggingPhoto = false;
  dragStartX = 0;
  dragStartY = 0;
  initialOffsetX = 0;
  initialOffsetY = 0;

  constructor(
    private fb: FormBuilder,
    private usuariosApiService: UsuariosApiService
  ) { }

  /* =========================================================
     CICLO DE VIDA
     ========================================================= */
  ngOnInit(): void {
    this.buildForm();
    this.configureAccessSection();
    this.loadUsuarios();
  }

  /* =========================================================
     GETTERS DE APOYO
     ========================================================= */
  get tieneAcceso(): boolean {
    return this.usuarioForm.get('tiene_acceso')?.value === true;
  }

  get pages(): number[] {
    const maxVisiblePages = 4;

    if (this.totalPages <= maxVisiblePages) {
      return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    }

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = endPage - maxVisiblePages + 1;
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );
  }

  get activePhoto(): UsuarioFoto | null {
    return this.usuarioFotos[this.activePhotoIndex] ?? null;
  }

  get selectedPhotoName(): string {
    return this.activePhoto?.name ?? '';
  }

  get photoPreviewUrl(): string | null {
    return this.activePhoto?.previewUrl ?? null;
  }

  get adjustedPhotoBase64(): string | null {
    return this.activePhoto?.adjustedBase64 ?? null;
  }

  get photoScale(): number {
    return this.activePhoto?.scale ?? 1;
  }

  get photoOffsetX(): number {
    return this.activePhoto?.offsetX ?? 0;
  }

  get photoOffsetY(): number {
    return this.activePhoto?.offsetY ?? 0;
  }

  get photoFrameSize(): number {
    return this.photoSize;
  }

  get photoOffsetLimit(): number {
    return Math.max(80, Math.round(this.photoFrameSize * 0.75));
  }

  get photoFrameStyles(): Record<string, string> {
    const size = `${this.photoFrameSize}px`;

    return {
      width: size,
      height: size
    };
  }

  get photoImageStyles(): Record<string, string> {
    return {
      transform: `translate(${this.photoOffsetX}px, ${this.photoOffsetY}px) scale(${this.photoScale})`
    };
  }

  /* =========================================================
     CONSTRUCCIÓN DEL FORMULARIO
     ========================================================= */
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

  /* =========================================================
     HABILITAR / DESHABILITAR CAMPOS DE ACCESO AL SISTEMA
     ========================================================= */
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

  /* =========================================================
     CARGAR LISTADO DE USUARIOS
     ========================================================= */
  loadUsuarios(): void {
    this.loadingUsuarios = true;
    this.loadError = '';

    this.usuariosApiService.getAll().pipe(
      catchError(() => {
        this.loadError = 'No se pudo cargar el listado de usuarios.';
        return of([] as UsuarioListadoApi[]);
      }),
      finalize(() => {
        this.loadingUsuarios = false;
      })
    ).subscribe((response: UsuarioListadoApi[]) => {
      try {
        const data = Array.isArray(response) ? response : [];

        this.usuarios = data.map((item) => ({
          ...item,
          estado_usuario:
            item.estado_usuario === true || Number(item.estado_usuario) === 1
        }));

        this.filtroBusqueda = '';
        this.filtroEstado = '';
        this.filtroAcceso = '';
        this.filtroRol = '';
        this.currentPage = 1;

        this.applyFilters();
      } catch {
        this.loadError = 'Ocurrió un error al procesar la respuesta.';
        this.usuarios = [];
        this.usuariosFiltrados = [];
        this.usuariosPaginados = [];
        this.totalUsuarios = 0;
        this.totalPages = 0;
      }
    });
  }

  /* =========================================================
     FILTROS
     ========================================================= */
  applyFilters(): void {
    const texto = (this.filtroBusqueda ?? '').trim().toLowerCase();
    const listaBase = Array.isArray(this.usuarios) ? this.usuarios : [];

    this.usuariosFiltrados = listaBase.filter((usuario) => {
      const nombre = (usuario.nombre_completo ?? '').toLowerCase();
      const documento = (usuario.numero_documento ?? '').toLowerCase();
      const username = (usuario.username ?? '').toLowerCase();
      const email = (usuario.email ?? '').toLowerCase();

      const cumpleBusqueda =
        !texto ||
        nombre.includes(texto) ||
        documento.includes(texto) ||
        username.includes(texto) ||
        email.includes(texto);

      const cumpleEstado =
        this.filtroEstado === '' ||
        String(Number(!!usuario.estado_usuario)) === this.filtroEstado;

      const tieneAcceso = usuario.user_id !== null;

      const cumpleAcceso =
        this.filtroAcceso === '' ||
        String(Number(tieneAcceso)) === this.filtroAcceso;

      const cumpleRol =
        this.filtroRol === '' ||
        usuario.rol_codigo === this.filtroRol;

      return cumpleBusqueda && cumpleEstado && cumpleAcceso && cumpleRol;
    });

    this.totalUsuarios = this.usuariosFiltrados.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  /* =========================================================
     PAGINACIÓN
     ========================================================= */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.usuariosFiltrados.length / this.pageSize);

    if (this.totalPages === 0) {
      this.currentPage = 1;
      this.usuariosPaginados = [];
      return;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.usuariosPaginados = this.usuariosFiltrados.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePagination();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  clearFilters(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = '';
    this.filtroAcceso = '';
    this.filtroRol = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  /* =========================================================
     CONTROL DEL MODAL
     ========================================================= */
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

    this.usuarioFotos = [];
    this.activePhotoIndex = 0;
    this.showAccesoSection = false;
    this.isDraggingPhoto = false;

    this.usuarioForm.markAsPristine();
    this.usuarioForm.markAsUntouched();
  }

  /* =========================================================
     SECCIÓN DESPLEGABLE: ACCESO AL SISTEMA
     ========================================================= */
  toggleAccesoSection(): void {
    this.showAccesoSection = !this.showAccesoSection;
  }

  /* =========================================================
     FOTO - AJUSTES
     - Tamaño fijo 450x450
     - Solo se resetea la foto activa
     ========================================================= */
  resetPhotoAdjustments(): void {
    const foto = this.activePhoto;
    if (!foto) {
      return;
    }

    foto.scale = 1;
    foto.offsetX = 0;
    foto.offsetY = 0;
    foto.adjustedBase64 = null;
    this.isDraggingPhoto = false;
  }

  onPhotoScaleChange(value: number): void {
    const foto = this.activePhoto;
    if (!foto) {
      return;
    }

    foto.scale = this.clamp(Number(value) || 1, 1, 2.5);
    this.normalizePhotoOffsets();
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private normalizePhotoOffsets(): void {
    const foto = this.activePhoto;
    if (!foto) {
      return;
    }

    foto.offsetX = this.clamp(foto.offsetX, -this.photoOffsetLimit, this.photoOffsetLimit);
    foto.offsetY = this.clamp(foto.offsetY, -this.photoOffsetLimit, this.photoOffsetLimit);
  }

  /* =========================================================
     FOTO - SELECCIONAR IMÁGENES
     - Permite cargar hasta 4 fotos
     - Cada foto mantiene su propio ajuste
     ========================================================= */
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (!files.length) {
      return;
    }

    const disponibles = this.maxPhotos - this.usuarioFotos.length;
    if (disponibles <= 0) {
      input.value = '';
      return;
    }

    const archivosTomados = files.slice(0, disponibles);

    archivosTomados.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        this.usuarioFotos.push({
          name: file.name,
          file,
          previewUrl: reader.result as string,
          adjustedBase64: null,
          scale: 1,
          offsetX: 0,
          offsetY: 0
        });

        this.activePhotoIndex = this.usuarioFotos.length - 1;
      };

      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  selectPhoto(index: number): void {
    if (index < 0 || index >= this.usuarioFotos.length) {
      return;
    }

    this.activePhotoIndex = index;
    this.isDraggingPhoto = false;
  }

  removePhoto(index: number): void {
    if (index < 0 || index >= this.usuarioFotos.length) {
      return;
    }

    this.usuarioFotos.splice(index, 1);

    if (this.usuarioFotos.length === 0) {
      this.activePhotoIndex = 0;
      this.isDraggingPhoto = false;
      return;
    }

    if (index < this.activePhotoIndex) {
      this.activePhotoIndex--;
    } else if (index === this.activePhotoIndex) {
      this.activePhotoIndex = Math.max(0, this.activePhotoIndex - 1);
    }

    if (this.activePhotoIndex >= this.usuarioFotos.length) {
      this.activePhotoIndex = this.usuarioFotos.length - 1;
    }

    this.isDraggingPhoto = false;
  }

  /* =========================================================
     FOTO - DRAG DENTRO DEL MARCO DE AJUSTE
     - Permite centrar la foto activa arrastrando con el mouse
     ========================================================= */
  onPhotoEditorMouseDown(event: MouseEvent): void {
    const foto = this.activePhoto;
    if (!foto) {
      return;
    }

    event.preventDefault();

    this.isDraggingPhoto = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialOffsetX = foto.offsetX;
    this.initialOffsetY = foto.offsetY;
  }

  @HostListener('document:mousemove', ['$event'])
  onPhotoEditorMouseMove(event: MouseEvent): void {
    const foto = this.activePhoto;

    if (!this.isDraggingPhoto || !foto) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    foto.offsetX = this.clamp(
      this.initialOffsetX + deltaX,
      -this.photoOffsetLimit,
      this.photoOffsetLimit
    );

    foto.offsetY = this.clamp(
      this.initialOffsetY + deltaY,
      -this.photoOffsetLimit,
      this.photoOffsetLimit
    );
  }

  @HostListener('document:mouseup')
  onPhotoEditorMouseUp(): void {
    this.isDraggingPhoto = false;
  }

  /* =========================================================
     FOTO - ZOOM CON RUEDA DEL MOUSE
     ========================================================= */
  onPhotoEditorWheel(event: WheelEvent): void {
    const foto = this.activePhoto;

    if (!foto) {
      return;
    }

    event.preventDefault();

    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    const nextScale = parseFloat((foto.scale + delta).toFixed(1));

    foto.scale = this.clamp(nextScale, 1, 2.5);
    this.normalizePhotoOffsets();
  }

  /* =========================================================
     FOTO - CARGAR IMAGEN EN MEMORIA
     ========================================================= */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  /* =========================================================
     FOTO - GENERAR BASE64 FINAL AJUSTADO
     - Genera la imagen final 450x450 por cada foto
     ========================================================= */
  private async buildAdjustedPhotoBase64(foto: UsuarioFoto): Promise<string | null> {
    if (!foto?.previewUrl) {
      return null;
    }

    const image = await this.loadImage(foto.previewUrl);
    const size = this.photoFrameSize;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;

    const baseScale = Math.max(size / imageWidth, size / imageHeight);
    const finalScale = baseScale * foto.scale;

    const drawWidth = imageWidth * finalScale;
    const drawHeight = imageHeight * finalScale;

    const x = (size - drawWidth) / 2 + foto.offsetX;
    const y = (size - drawHeight) / 2 + foto.offsetY;

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, x, y, drawWidth, drawHeight);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  /* =========================================================
     GUARDAR USUARIO
     - Se envía JSON
     - Las fotos se envían en base64 para guardar en BD
     ========================================================= */
  async saveUsuario(): Promise<void> {
    this.formSubmitted = true;
    this.saveError = '';

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const raw = this.usuarioForm.getRawValue();

    let fotosPrincipalesBase64: string[] = [];

    if (this.usuarioFotos.length) {
      try {
        fotosPrincipalesBase64 = (
          await Promise.all(
            this.usuarioFotos.map(async (foto) => {
              const base64 = await this.buildAdjustedPhotoBase64(foto);
              foto.adjustedBase64 = base64;
              return base64;
            })
          )
        ).filter((item): item is string => !!item);
      } catch {
        this.saveError = 'No se pudieron procesar las fotos seleccionadas.';
        return;
      }
    }

    const payload = {
      nombres: raw.nombres,
      apellido_paterno: raw.apellido_paterno,
      apellido_materno: raw.apellido_materno || '',
      tipo_documento: raw.tipo_documento,
      numero_documento: raw.numero_documento,
      telefono: raw.telefono || '',
      direccion: raw.direccion || '',
      cargo: raw.cargo || '',
      estado: raw.estado ? 1 : 0,
      tiene_acceso: raw.tiene_acceso ? 1 : 0,

      username: raw.tiene_acceso ? raw.username : null,
      email: raw.tiene_acceso ? raw.email : null,
      password: raw.tiene_acceso ? raw.password : null,
      role_id: raw.tiene_acceso ? Number(raw.role_id) : null,

      /* =====================================================
         FOTOS EN BASE64
         - Se guardan en la base de datos
         - Cada foto se genera en formato final 450x450
         ===================================================== */
      fotos_principales_base64: fotosPrincipalesBase64
    };

    this.savingUsuario = true;

    this.usuariosApiService.create(payload).subscribe({
      next: () => {
        this.savingUsuario = false;
        this.closeUsuarioModal();
        this.loadUsuarios();
      },
      error: (error) => {
        this.savingUsuario = false;
        this.saveError =
          error?.error?.message ||
          'Ocurrió un error al registrar el usuario.';
      }
    });
  }

  /* =========================================================
     VALIDACIONES VISUALES
     ========================================================= */
  isInvalid(controlName: string): boolean {
    const control = this.usuarioForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.formSubmitted);
  }

  /* =========================================================
     HELPERS DE PRESENTACIÓN
     ========================================================= */
  getDocumento(usuario: UsuarioListado): string {
    return `${usuario.numero_documento}`;
  }

  getEstadoLabel(estado: boolean): string {
    return estado ? 'Activo' : 'Inactivo';
  }

  /* =========================================================
     ACCIONES DE TABLA
     ========================================================= */
  toggleEstado(usuario: UsuarioListado): void {
    usuario.estado_usuario = !usuario.estado_usuario;
    this.applyFilters();
  }

  editarUsuario(usuario: UsuarioListado): void {
    this.openUsuarioModal();
  }

  verUsuario(usuario: UsuarioListado): void { }
}