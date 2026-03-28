import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RolListadoApi {
    id: number;
    codigo: string;
    descripcion: string | null;
    estado: number;
    created_at: string;
    updated_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class RolesApiService {
    private readonly apiUrl = 'http://127.0.0.1:8000/api/roles';

    constructor(private http: HttpClient) { }

    getAll(): Observable<RolListadoApi[]> {
        return this.http.get<RolListadoApi[]>(this.apiUrl);
    }

    create(payload: any): Observable<any> {
        return this.http.post(this.apiUrl, payload);
    }

    /* =========================================================
       OBTENER ROL POR ID
       - Se usa para cargar datos completos en edición
       ========================================================= */
    getById(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    /* =========================================================
       ACTUALIZAR ROL
       - Se usa cuando el modal está en modo edición
       ========================================================= */
    update(id: number, payload: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, payload);
    }

    /* =========================================================
       ACTUALIZAR ESTADO DEL ROL
       - Activa o desactiva el rol en backend
       ========================================================= */
    updateEstado(id: number, estado: number | boolean): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/estado`, {
            estado: Number(estado) === 1 || estado === true ? 1 : 0
        });
    }
}