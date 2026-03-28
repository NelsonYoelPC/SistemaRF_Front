import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import {
  RolListadoApi,
  RolesApiService
} from '../../core/services/roles-api.service';

/* =========================================================
   INTERFAZ DEL LISTADO DE ROLES
   - Representa la estructura devuelta por el endpoint
   ========================================================= */
interface RolListado {
  id: number;
  codigo: string;
  descripcion: string | null;
  estado: number;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class RolesComponent implements OnInit {
  /* =========================================================
     ESTADO GENERAL DE LA PANTALLA
     ========================================================= */
  totalRoles = 0;
  showRolModal = false;

  savingRol = false;
  loadingRoles = false;
  saveError = '';
  loadError = '';

  /* =========================================================
     LISTADO, FILTROS Y PAGINACIÓN
     ========================================================= */
  roles: RolListado[] = [];
  rolesFiltrados: RolListado[] = [];
  rolesPaginados: RolListado[] = [];

  searchTerm = '';
  estadoFiltro = '';

  currentPage = 1;
  pageSize = 3;
  totalPages = 0;

  /* =========================================================
     CONTROL DE CAMBIO DE ESTADO
     ========================================================= */
  changingEstadoRolId: number | null = null;

  /* =========================================================
     MODO EDICIÓN
     ========================================================= */
  isEditMode = false;
  editingRolId: number | null = null;

  /* =========================================================
     FORMULARIO SIMPLE CON NGMODEL
     ========================================================= */
  rolForm = {
    codigo: '',
    descripcion: '',
    estado: 1
  };

  constructor(
    private rolesApiService: RolesApiService,
    private cdr: ChangeDetectorRef
  ) { }

  /* =========================================================
     CICLO DE VIDA
     ========================================================= */
  ngOnInit(): void {
    this.loadRoles();
  }

  /* =========================================================
     GETTER DE PÁGINAS
     - Mantiene una paginación compacta y ordenada
     ========================================================= */
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

  /* =========================================================
     SINCRONIZAR VISTA
     - Refresca la plantilla luego de cambios importantes
     ========================================================= */
  private syncView(): void {
    this.cdr.detectChanges();
  }

  /* =========================================================
     CARGAR LISTADO DE ROLES
     - Carga inicial y recarga posterior al guardar
     ========================================================= */
  loadRoles(): void {
    this.loadingRoles = true;
    this.loadError = '';
    this.syncView();

    this.rolesApiService.getAll().pipe(
      catchError((error) => {
        console.error('Error al cargar roles:', error);
        this.loadError = 'No se pudo cargar el listado de roles.';
        return of([] as any);
      }),
      finalize(() => {
        this.loadingRoles = false;
        this.syncView();
      })
    ).subscribe((response: any) => {
      try {
        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        this.roles = data.map((item: RolListadoApi) => ({
          id: Number(item.id),
          codigo: item.codigo ?? '',
          descripcion: item.descripcion ?? null,
          estado: Number(item.estado) === 1 ? 1 : 0,
          created_at: item.created_at ?? '',
          updated_at: item.updated_at ?? ''
        }));

        this.searchTerm = '';
        this.estadoFiltro = '';
        this.currentPage = 1;

        this.applyFilters();
        this.syncView();
      } catch (error) {
        console.error('Error al procesar la respuesta de roles:', error);
        this.loadError = 'Ocurrió un error al procesar la respuesta.';
        this.roles = [];
        this.rolesFiltrados = [];
        this.rolesPaginados = [];
        this.totalRoles = 0;
        this.totalPages = 0;
        this.syncView();
      }
    });
  }

  /* =========================================================
     FILTROS
     ========================================================= */
  applyFilters(): void {
    const texto = (this.searchTerm ?? '').trim().toLowerCase();
    const listaBase = Array.isArray(this.roles) ? this.roles : [];

    this.rolesFiltrados = listaBase.filter((rol) => {
      const codigo = (rol.codigo ?? '').toLowerCase();
      const descripcion = (rol.descripcion ?? '').toLowerCase();

      const cumpleBusqueda =
        !texto ||
        codigo.includes(texto) ||
        descripcion.includes(texto);

      const cumpleEstado =
        this.estadoFiltro === '' ||
        String(Number(rol.estado)) === this.estadoFiltro;

      return cumpleBusqueda && cumpleEstado;
    });

    this.totalRoles = this.rolesFiltrados.length;
    this.currentPage = 1;

    this.updatePagination();
    this.syncView();
  }

  /* =========================================================
     PAGINACIÓN
     ========================================================= */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.rolesFiltrados.length / this.pageSize);

    if (this.totalPages === 0) {
      this.currentPage = 1;
      this.rolesPaginados = [];
      this.syncView();
      return;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.rolesPaginados = this.rolesFiltrados.slice(startIndex, endIndex);
    this.syncView();
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
    this.searchTerm = '';
    this.estadoFiltro = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  /* =========================================================
     CONTROL DEL MODAL
     ========================================================= */
  openRolModal(rol?: RolListado): void {
    this.isEditMode = false;
    this.editingRolId = null;
    this.saveError = '';
    this.resetForm();
    this.showRolModal = true;

    if (rol) {
      this.isEditMode = true;
      this.editingRolId = rol.id;

      this.rolForm = {
        codigo: rol.codigo ?? '',
        descripcion: rol.descripcion ?? '',
        estado: Number(rol.estado) === 1 ? 1 : 0
      };
    }

    this.syncView();
  }

  closeRolModal(): void {
    this.showRolModal = false;
    this.saveError = '';
    this.isEditMode = false;
    this.editingRolId = null;
    this.resetForm();
    this.syncView();
  }

  resetForm(): void {
    this.rolForm = {
      codigo: '',
      descripcion: '',
      estado: 1
    };
  }

  /* =========================================================
     NORMALIZACIÓN DEL CÓDIGO
     - Convierte a mayúsculas y reemplaza espacios
     ========================================================= */
  onCodigoInput(): void {
    this.rolForm.codigo = (this.rolForm.codigo ?? '')
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
  }

  /* =========================================================
     GUARDAR ROL
     - Si está en modo edición: PUT
     - Si está en modo nuevo: POST
     ========================================================= */
  saveRol(): void {
    this.saveError = '';

    const codigo = (this.rolForm.codigo ?? '').trim();
    const descripcion = (this.rolForm.descripcion ?? '').trim();

    if (!codigo) {
      this.saveError = 'El código del rol es obligatorio.';
      this.syncView();
      return;
    }

    const payload = {
      codigo,
      descripcion: descripcion || null,
      estado: Number(this.rolForm.estado) === 1 ? 1 : 0
    };

    this.savingRol = true;
    this.syncView();

    const request$ =
      this.isEditMode && this.editingRolId
        ? this.rolesApiService.update(this.editingRolId, payload)
        : this.rolesApiService.create(payload);

    request$.pipe(
      finalize(() => {
        this.savingRol = false;
        this.syncView();
      })
    ).subscribe({
      next: () => {
        this.closeRolModal();
        this.loadRoles();
      },
      error: (error) => {
        console.error('Error al guardar rol:', error);
        this.saveError =
          error?.error?.message ||
          (this.isEditMode
            ? 'Ocurrió un error al actualizar el rol.'
            : 'Ocurrió un error al registrar el rol.');

        this.syncView();
      }
    });
  }

  /* =========================================================
     ACTIVAR / DESACTIVAR ROL
     - Cambia el estado real en la BD
     ========================================================= */
  toggleEstado(rol: RolListado): void {
    if (this.changingEstadoRolId === rol.id) {
      return;
    }

    const nuevoEstado = Number(rol.estado) === 1 ? 0 : 1;
    this.changingEstadoRolId = rol.id;
    this.loadError = '';
    this.syncView();

    this.rolesApiService.updateEstado(rol.id, nuevoEstado).subscribe({
      next: () => {
        rol.estado = nuevoEstado;
        this.applyFilters();
        this.changingEstadoRolId = null;
        this.syncView();
      },
      error: (error) => {
        console.error('Error al actualizar estado del rol:', error);
        this.loadError =
          error?.error?.message ||
          'No se pudo actualizar el estado del rol.';
        this.changingEstadoRolId = null;
        this.syncView();
      }
    });
  }

  /* =========================================================
     HELPERS DE PRESENTACIÓN
     ========================================================= */
  getEstadoLabel(estado: number): string {
    return Number(estado) === 1 ? 'Activo' : 'Inactivo';
  }
}