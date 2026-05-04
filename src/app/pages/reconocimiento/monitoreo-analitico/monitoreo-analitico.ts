import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { UsuariosApiService } from '../../../core/services/usuarios-api.service';

// Mediapipe Imports
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import * as FACEMESH from '@mediapipe/face_mesh';

interface Camera {
  id: number;
  nombre: string;
  zona: string;
  online: boolean;
  enAlerta: boolean;
  personaNombre?: string;
  landmarks?: any[]; // Puntos vectoriales reales
}

interface TabGroup {
  id: number;
  camaras: Camera[];
}

@Component({
  selector: 'app-monitoreo-analitico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monitoreo-analitico.html',
  styleUrls: ['./monitoreo-analitico.css']
})
export class MonitoreoAnaliticoComponent implements OnInit, OnDestroy {
  activeTab: number = 1;
  totalCamaras: number = 10;
  tabs: TabGroup[] = [];
  detecciones: any[] = [];
  personasInteres: any[] = [];
  selectedCamara: Camera | null = null;
  
  private faceMesh!: FaceMesh;

  constructor(
    private router: Router,
    private usuariosService: UsuariosApiService
  ) { }

  toggleFullscreen(camara: Camera) {
    this.selectedCamara = camara;
  }

  closeFullscreen() {
    this.selectedCamara = null;
  }

  ngOnInit(): void {
    this.initMediapipe();
    this.cargarPersonasInteres();
    this.generarCamarasSimuladas();
    
    // Simular alertas aleatorias para ver la malla en acción
    setInterval(() => {
      this.simularAlertaAleatoria();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.faceMesh) {
      this.faceMesh.close();
    }
  }

  private initMediapipe() {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults((results) => {
      this.handleFaceMeshResults(results);
    });
  }

  private handleFaceMeshResults(results: Results) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const todas = this.tabs.flatMap(t => t.camaras);
      const camaraEnAlerta = todas.find(c => c.enAlerta);
      if (camaraEnAlerta) {
        camaraEnAlerta.landmarks = results.multiFaceLandmarks[0];
      }
    }
  }

  cargarPersonasInteres() {
    this.usuariosService.getPersonasInteres().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.personasInteres = res.data.map((item: any) => ({
            id: item.usuario.id,
            nombre_completo: `${item.usuario.nombres} ${item.usuario.apellido_paterno} ${item.usuario.apellido_materno || ''}`.trim(),
            numero_documento: item.usuario.numero_documento,
            foto_principal: item.usuario.fotos.length > 0 ? item.usuario.fotos[0].base64 : null,
            fotos_count: item.usuario.fotos.length
          }));
        }
      },
      error: (err: any) => console.error('Error al cargar objetivos desde DB', err)
    });
  }

  generarCamarasSimuladas() {
    const todasLasCamaras: Camera[] = [];
    const zonas = ['Entrada Principal', 'Pasillo A', 'Estacionamiento', 'Comedor', 'Almacén'];
    
    for (let i = 1; i <= this.totalCamaras; i++) {
      todasLasCamaras.push({
        id: i,
        nombre: `Cámara ${i.toString().padStart(2, '0')}`,
        zona: zonas[Math.floor(Math.random() * zonas.length)],
        online: true,
        enAlerta: false
      });
    }

    const groupSize = 6;
    for (let i = 0; i < todasLasCamaras.length; i += groupSize) {
      this.tabs.push({
        id: (i / groupSize) + 1,
        camaras: todasLasCamaras.slice(i, i + groupSize)
      });
    }
  }

  getCamarasByActiveTab(): Camera[] {
    const tab = this.tabs.find(t => t.id === this.activeTab);
    return tab ? tab.camaras : [];
  }

  enfocarCamara(camaraId: number) {
    const tabFound = this.tabs.find(t => t.camaras.some(c => c.id === camaraId));
    if (tabFound) {
      this.activeTab = tabFound.id;
      const camara = tabFound.camaras.find(c => c.id === camaraId);
      if (camara) {
        camara.enAlerta = true;
        setTimeout(() => camara.enAlerta = false, 3000);
      }
    }
  }

  simularAlertaAleatoria() {
    const todas = this.tabs.flatMap(t => t.camaras);
    const randomIdx = Math.floor(Math.random() * todas.length);
    const camara = todas[randomIdx];
    
    if (this.personasInteres.length > 0) {
      const p = this.personasInteres[Math.floor(Math.random() * this.personasInteres.length)];
      camara.personaNombre = p.nombre_completo;
    }

    // Simulamos unos puntos vectoriales de Mediapipe para la previsualización
    camara.landmarks = this.generarLandmarksSimulados();
    
    camara.enAlerta = true;
    setTimeout(() => {
      camara.enAlerta = false;
      camara.landmarks = undefined;
    }, 4000);
  }

  private generarLandmarksSimulados() {
    // Generamos 20 puntos al azar que simulen la cara para el diseño
    const points = [];
    for(let i=0; i<30; i++) {
      points.push({ x: 0.3 + Math.random()*0.4, y: 0.2 + Math.random()*0.6 });
    }
    return points;
  }

  irAPersonasInteres() {
    this.router.navigate(['/app/reconocimiento/personas-interes']);
  }
}
