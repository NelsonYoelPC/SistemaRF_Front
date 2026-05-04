import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuariosApiService } from '../../../core/services/usuarios-api.service';
import { SessionService } from '../../../core/services/session.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-personas-interes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personas-interes.html',
  styleUrls: ['./personas-interes.css']
})
export class PersonasInteresComponent implements OnInit {
  dniBusqueda: string = '';
  usuarioEncontrado: any = null;
  buscando: boolean = false;
  listaVigilancia: any[] = [];

  // Nuevos campos para el registro
  nuevoMotivo: string = '';
  nuevaPrioridad: string = 'Media';

  // Datos del Solicitante
  dniSolicitante: string = '';
  solicitanteEncontrado: any = null;

  // Estado del Modal y Flujo
  mostrarModal: boolean = false;
  configuracionLista: boolean = false;

  constructor(
    private usuariosService: UsuariosApiService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  abrirModalVigilancia() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.dniSolicitante = '';
    this.solicitanteEncontrado = null;
    this.nuevoMotivo = '';
    this.nuevaPrioridad = 'Media';
  }

  // Este método solo valida la configuración en el modal
  confirmarConfiguracion() {
    if (this.solicitanteEncontrado && this.nuevoMotivo.trim()) {
      this.configuracionLista = true;
      this.mostrarModal = false;
      Swal.fire({
        title: 'Configuración Lista',
        text: 'Los datos del solicitante han sido validados. Ahora puede iniciar la vigilancia.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  ngOnInit(): void {
    this.cargarListaVigilancia();
  }

  buscarSolicitante() {
    if (!this.dniSolicitante.trim()) return;

    this.usuariosService.getAll().subscribe({
      next: (usuarios: any[]) => {
        const user = usuarios.find(u => u.numero_documento === this.dniSolicitante);
        if (user) {
          this.usuariosService.getById(user.usuario_id).subscribe({
            next: (detalle: any) => {
              const data = detalle.data;
              this.solicitanteEncontrado = {
                id: data.id,
                nombre_completo: `${data.nombres} ${data.apellido_paterno} ${data.apellido_materno || ''}`.trim(),
                cargo: data.cargo,
                foto_principal: data.fotos.length > 0 ? data.fotos[0].base64 : null,
              };
            },
            error: () => this.mostrarError('Error al obtener datos del solicitante.')
          });
        } else {
          this.mostrarError('Solicitante no encontrado.');
        }
      }
    });
  }

  cargarListaVigilancia() {
    this.usuariosService.getPersonasInteres().subscribe({
      next: (res: any) => {
        if (res.status) {
          // Mapeamos la respuesta para que coincida con el formato del componente
          this.listaVigilancia = res.data.map((item: any) => ({
            id: item.usuario.id,
            nombre_completo: `${item.usuario.nombres} ${item.usuario.apellido_paterno} ${item.usuario.apellido_materno || ''}`.trim(),
            numero_documento: item.usuario.numero_documento,
            cargo: item.usuario.cargo,
            foto_principal: item.usuario.fotos.length > 0 ? item.usuario.fotos[0].base64 : null,
            fotos_count: item.usuario.fotos.length,
            prioridad: item.prioridad
          }));
        }
      },
      error: () => this.mostrarError('Error al cargar la lista de vigilancia.')
    });
  }

  buscarUsuario() {
    if (!this.dniBusqueda.trim()) return;

    this.buscando = true;
    this.usuarioEncontrado = null;

    this.usuariosService.getAll().subscribe({
      next: (usuarios: any[]) => {
        const user = usuarios.find(u => u.numero_documento === this.dniBusqueda);
        
        if (user) {
          this.usuariosService.getById(user.usuario_id).subscribe({
            next: (detalle: any) => {
              const data = detalle.data;
              this.usuarioEncontrado = {
                id: data.id,
                nombre_completo: `${data.nombres} ${data.apellido_paterno} ${data.apellido_materno || ''}`.trim(),
                numero_documento: data.numero_documento,
                cargo: data.cargo,
                foto_principal: data.fotos.length > 0 ? data.fotos[0].base64 : null,
                fotos_count: data.fotos.length
              };
              this.buscando = false;
            },
            error: () => {
              this.buscando = false;
              this.mostrarError('No se pudo obtener el detalle del usuario.');
            }
          });
        } else {
          this.buscando = false;
          this.mostrarError('No se encontró ningún usuario con ese DNI.');
        }
      },
      error: () => {
        this.buscando = false;
        this.mostrarError('Error al conectar con el servidor.');
      }
    });
  }

  agregarALista() {
    if (!this.usuarioEncontrado) return;

    if (this.listaVigilancia.some(u => u.id === this.usuarioEncontrado.id)) {
      Swal.fire('Atención', 'Esta persona ya se encuentra en la lista de vigilancia activa.', 'info');
      return;
    }

    if (this.usuarioEncontrado.fotos_count < 4) {
      Swal.fire({
        title: 'Calidad Facial Baja',
        text: `El usuario solo tiene ${this.usuarioEncontrado.fotos_count} fotos. Para un reconocimiento óptimo se requieren 4. ¿Desea agregarlo de todos modos?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, agregar',
        cancelButtonText: 'No, ir a Usuarios',
        reverseButtons: true
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.ejecutarAgregado();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          this.router.navigate(['/app/administracion/usuarios']);
        }
      });
    } else {
      this.ejecutarAgregado();
    }
  }

  ejecutarAgregado() {
    if (!this.solicitanteEncontrado) {
      this.mostrarError('Debe buscar e identificar a un solicitante antes de continuar.');
      return;
    }

    const payload = {
      usuario_id: this.usuarioEncontrado.id,
      prioridad: this.nuevaPrioridad,
      motivo: this.nuevoMotivo || 'Sin motivo especificado',
      creado_por: this.solicitanteEncontrado.id
    };

    this.usuariosService.addPersonaInteres(payload).subscribe({
      next: (res: any) => {
        if (res.status) {
          Swal.fire('Éxito', res.message, 'success');
          this.cargarListaVigilancia(); 
          this.configuracionLista = false;
          this.usuarioEncontrado = null; 
          this.solicitanteEncontrado = null;
          this.dniBusqueda = '';
          this.dniSolicitante = '';
          this.nuevoMotivo = '';
          this.nuevaPrioridad = 'Media';
        }
      },
      error: (err: any) => {
        this.mostrarError(err.error?.message || 'Error al agregar a vigilancia.');
      }
    });
  }

  quitarDeLista(id: number) {
    Swal.fire({
      title: '¿Quitar de vigilancia?',
      text: 'La persona dejará de ser rastreada pero el registro se mantendrá en el log del sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.usuariosService.removePersonaInteres(id).subscribe({
          next: (res: any) => {
            if (res.status) {
              Swal.fire('Desactivado', res.message, 'success');
              this.cargarListaVigilancia();
            }
          },
          error: () => this.mostrarError('Error al intentar quitar de vigilancia.')
        });
      }
    });
  }

  private mostrarError(msg: string) {
    Swal.fire('Error', msg, 'error');
  }

  // Helpers para el diseño
  getCalidadClass(count: number) {
    if (count >= 4) return 'high';
    if (count > 0) return 'medium';
    return 'low';
  }

  getCalidadIcon(count: number) {
    if (count >= 4) return 'bi-check-circle-fill';
    if (count > 0) return 'bi-exclamation-triangle-fill';
    return 'bi-x-circle-fill';
  }

  getCalidadProgressClass(count: number) {
    if (count >= 4) return 'bg-success';
    if (count > 0) return 'bg-warning';
    return 'bg-danger';
  }

  getCalidadMensaje(count: number) {
    if (count >= 4) return 'Óptima para reconocimiento.';
    if (count > 0) return 'Limitada. Se recomiendan 4 fotos.';
    return 'Insuficiente. No se puede reconocer.';
  }
}
