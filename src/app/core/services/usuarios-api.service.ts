import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioListadoApi {
    usuario_id: number;
    nombre_completo: string;
    tipo_documento: string;
    numero_documento: string;
    telefono: string | null;
    cargo: string | null;
    estado_usuario: boolean | number;
    user_id: number | null;
    username: string | null;
    email: string | null;
    rol_codigo: string | null;
    rol_descripcion: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class UsuariosApiService {
    private readonly apiUrl = 'http://127.0.0.1:8000/api/usuarios';

    constructor(private http: HttpClient) { }

    getAll(): Observable<UsuarioListadoApi[]> {
        return this.http.get<UsuarioListadoApi[]>(this.apiUrl);
    }

    create(payload: any): Observable<any> {
        return this.http.post(this.apiUrl, payload);
    }
    /* =========================================================
   OBTENER USUARIO POR ID
   - Se usa para cargar datos completos en edición
   ========================================================= */
    getById(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    /* =========================================================
       ACTUALIZAR USUARIO
       - Se usa cuando el modal está en modo edición
       ========================================================= */
    update(id: number, payload: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, payload);
    }
    /* =========================================================
   ACTUALIZAR ESTADO DEL USUARIO
   - Activa o desactiva el usuario en backend
   ========================================================= */
    updateEstado(id: number, estado: boolean): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/estado`, {
            estado: estado ? 1 : 0
        });
    }
}