import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { UsuariosApiService } from '../../../core/services/usuarios-api.service';
import Swal from 'sweetalert2';


// Mediapipe Imports
import * as FACEMESH from '@mediapipe/face_mesh';

interface Camera {
  id: number;
  nombre: string;
  zona: string;
  online: boolean;
  enAlerta: boolean;
  personaNombre?: string;
  motor: number; // 0: Estándar, 1: Masivo
  onlineReal?: boolean;
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

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChildren('outputCanvas') outputCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  
  facingMode: 'user' | 'environment' = 'user';
  private socket!: WebSocket;
  private faceMesh!: any;
  private isProcessingFaceMesh = false;

  constructor(
    private router: Router,
    private usuariosService: UsuariosApiService,
    private ngZone: NgZone
  ) { }

  toggleFullscreen(camara: Camera) {
    this.selectedCamara = camara;
  }

  closeFullscreen() {
    this.selectedCamara = null;
  }

  currentStream: MediaStream | null = null;

  getStream(): MediaStream | null {
    if (this.currentStream) return this.currentStream;
    if (this.localVideo && this.localVideo.nativeElement) {
      this.currentStream = this.localVideo.nativeElement.srcObject as MediaStream;
      return this.currentStream;
    }
    return null;
  }

  ngOnInit(): void {
    this.cargarPersonasInteres();
    this.generarCamarasSimuladas();
    this.iniciarAlertasSimuladas();
    this.setupFaceMesh();
    this.conectarWebSocket();
  }

  conectarWebSocket() {
    // Usamos wss:// porque tu servidor usa HTTPS
    const wsUrl = 'wss://192.168.1.38:5050/ws/recognition';
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => console.log("WebSocket conectado correctamente");

    this.socket.onmessage = (event) => {
      this.ngZone.run(async () => {
        const data = event.data;
        const camara01 = this.tabs[0]?.camaras[0];
        
        // MODO 1: Procesamiento de Video (Blob)
        if (data instanceof Blob) {
          if (camara01 && !camara01.onlineReal) {
            const url = URL.createObjectURL(data);
            
            // 1. Mostrar Video (SIEMPRE - Flujo constante)
            camara01.landmarks = [{ streamingImage: url }];
            
            // 2. Procesar IA (SOLO SI LA PC ESTÁ LIBRE)
            if (!this.isProcessingFaceMesh) {
              this.isProcessingFaceMesh = true;
              const img = new Image();
              img.src = url;
              img.onload = async () => {
                try {
                  await this.faceMesh.send({ image: img });
                } finally {
                  this.isProcessingFaceMesh = false;
                  URL.revokeObjectURL(url);
                }
              };
            } else {
              // Si la PC está ocupada, no calculamos puntos pero liberamos la URL
              setTimeout(() => URL.revokeObjectURL(url), 100);
            }
          }
        }
        // MODO 2: Procesamiento de Alertas Reales y Control (String JSON desde Python)
        else if (typeof data === 'string') {
          try {
            const result = JSON.parse(data);
            
            // --- CONTROL DE CONCURRENCIA ---
            if (result.action === 'lock_granted') {
              this.procesarEncendidoCamara(result.camera_id);
            } else if (result.action === 'lock_denied') {
              Swal.fire('En Uso', 'Esta cámara ya está siendo transmitida por otro operador. Intente más tarde.', 'warning');
            } else if (result.action === 'camera_status') {
              // Actualizar UI para los demás
              const camFound = this.tabs.flatMap(t => t.camaras).find(c => c.id === result.camera_id);
              if (camFound) {
                // (Opcional) Puedes crear la propiedad enUsoRemoto en la interfaz Camera
                // camFound.enUsoRemoto = (result.status === 'in_use');
              }
            }
            // --- ALERTAS DE RECONOCIMIENTO ---
            else if (result.status === 'success' && result.recognized && result.data && result.data.match_folder) {
              const matchId = Number(result.data.match_folder);
              const personaDetectada = this.personasInteres.find(p => p.id === matchId);
              
              if (personaDetectada && camara01) {
                camara01.personaNombre = personaDetectada.nombre_completo;
                camara01.enAlerta = true;
                
                // [NUEVO] UI Táctica: Marcar en el panel lateral
                personaDetectada.estaEnEscena = true;
                
                // Mover al principio de la lista
                const idx = this.personasInteres.indexOf(personaDetectada);
                if (idx > 0) {
                  this.personasInteres.splice(idx, 1);
                  this.personasInteres.unshift(personaDetectada);
                }

                if (personaDetectada.timeoutEscena) clearTimeout(personaDetectada.timeoutEscena);
                personaDetectada.timeoutEscena = setTimeout(() => {
                  personaDetectada.estaEnEscena = false;
                }, 5000); // 5 segundos de permanencia visual
                
                // [PRUEBA SOLICITADA] Lanzar alerta en el centro de la pantalla
                if (!Swal.isVisible()) {
                  Swal.fire({
                    icon: 'error',
                    title: '¡OBJETIVO DETECTADO!',
                    html: `La cámara ha identificado a:<br><br><h3 style="color: red; margin:0;">${personaDetectada.nombre_completo}</h3><br>DNI: ${personaDetectada.numero_documento}`,
                    timer: 3000,
                    showConfirmButton: false,
                    backdrop: `rgba(255,0,0,0.2)`
                  });
                }

                setTimeout(() => camara01.enAlerta = false, 4000);
              }
            }
          } catch (e) {
            console.error('Error parseando JSON del WebSocket:', e);
          }
        }
      });
    };

    this.socket.onerror = (err) => console.error("Error en WebSocket:", err);

    this.socket.onclose = () => {
      setTimeout(() => this.conectarWebSocket(), 3000); // Reintento
    };
  }

  iniciarAlertasSimuladas() {
    // Simulador apagado. Las alertas ahora son 100% reales mediante WebSocket JSON.
    // setInterval(() => {
    //   this.simularAlertaAleatoria();
    // }, 5000);
  }

  setupFaceMesh() {
    this.faceMesh = new FACEMESH.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults((results: any) => this.handleFaceMeshResults(results));
  }

  toggleCamara(camara: Camera) {
    if (camara.onlineReal) {
      this.apagarCamaraReal(camara);
    } else {
      this.encenderCamaraReal(camara);
    }
  }

  encenderCamaraReal(camara: Camera) {
    if (camara.id !== 1) return;
    
    // 1. Pedir permiso al Árbitro (Python)
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action: 'lock_camera', camera_id: camara.id }));
    } else {
      Swal.fire('Error', 'No hay conexión con el servidor IA.', 'error');
    }
  }

  apagarCamaraReal(camara: Camera) {
    camara.onlineReal = false;
    if (this.localVideo?.nativeElement.srcObject) {
      const stream = this.localVideo.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.localVideo.nativeElement.srcObject = null;
    }
    // Avisar al servidor para liberar el candado
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action: 'unlock_camera', camera_id: camara.id }));
    }
  }

  procesarEncendidoCamara(camaraId: number) {
    const camara = this.tabs.flatMap(t => t.camaras).find(c => c.id === camaraId);
    if (!camara) return;

    const constraints = { 
      video: { 
        facingMode: this.facingMode,
        width: { ideal: 640 },
        height: { ideal: 480 }
      } 
    };

    const successHandler = (stream: MediaStream) => {
      camara.onlineReal = true;
      this.isProcessingFaceMesh = false;
      this.currentStream = stream;
      const video = this.localVideo.nativeElement;
      video.srcObject = stream;
        
        // Canvas compartido para asegurar que el celular (MediaPipe) no falle al leer el video
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 640;
        offCanvas.height = 480;
        const offCtx = offCanvas.getContext('2d');

        video.onloadedmetadata = () => {
          video.play();
          streamLoop();
        };

        let lastSend = 0;
        
        // BUCLE 1: Retransmisión de Video (Binario - Alta Calidad)
        const streamLoop = () => {
          if (!camara.onlineReal) return;
          
          const now = Date.now();
          if (now - lastSend > 50 && this.socket.readyState === WebSocket.OPEN) {
            offCtx?.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);
            
            // Enviar como BLOB
            offCanvas.toBlob((blob) => {
              if (blob) this.socket.send(blob);
            }, 'image/jpeg', 0.8);
            
            lastSend = now;
          }
          requestAnimationFrame(streamLoop);
        };

        // BUCLE 2: Procesamiento Local de Malla Facial (SOLO MOTOR ESTÁNDAR)
        const faceMeshLoop = async () => {
          if (!camara.onlineReal) return;
          
          if (camara.motor === 1) {
            requestAnimationFrame(faceMeshLoop);
            return;
          }
          
          if (!this.isProcessingFaceMesh) {
            this.isProcessingFaceMesh = true;
            try {
              // Usar el canvas en lugar del video asegura compatibilidad total en móviles
              offCtx?.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);
              await this.faceMesh.send({ image: offCanvas });
            } catch (error) {
              // Ignorar errores
            } finally {
              this.isProcessingFaceMesh = false;
            }
          }
          requestAnimationFrame(faceMeshLoop);
        };

        streamLoop();
        faceMeshLoop(); // Activado para pintar la malla localmente
    };

    navigator.mediaDevices.getUserMedia(constraints).then(successHandler).catch(err => {
      // Fallback genérico para Webcams USB de PC que no soportan "facingMode"
      console.warn("Fallo al abrir cámara con facingMode:", err.message);
      navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } })
        .then(successHandler)
        .catch(err2 => {
          Swal.fire('Error', 'No se pudo abrir la cámara: ' + err2.message, 'error');
          this.apagarCamaraReal(camara);
        });
    });
  }

  cambiarCamara(camara: Camera) {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    // Detenemos el stream actual si existe
    if (this.localVideo?.nativeElement.srcObject) {
      const stream = this.localVideo.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    this.currentStream = null;
    // Reiniciamos con la nueva cámara
    this.encenderCamaraReal(camara);
  }

  handleFaceMeshResults(results: any) {
    // 1. Lógica para Cámara Real (Canvas)
    if (this.outputCanvases && this.outputCanvases.length > 0) {
      this.outputCanvases.forEach(canvasRef => {
        const canvas = canvasRef.nativeElement;
        const canvasCtx = canvas.getContext('2d')!;
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiFaceLandmarks) {
          canvasCtx.fillStyle = '#2dd4bf';
          for (const landmarks of results.multiFaceLandmarks) {
            for (const landmark of landmarks) {
              const x = landmark.x * canvas.width;
              const y = landmark.y * canvas.height;
              canvasCtx.beginPath();
              canvasCtx.arc(x, y, 1.5, 0, 2 * Math.PI);
              canvasCtx.fill();
            }
          }
        }
        canvasCtx.restore();
      });
    }

    // 2. Lógica para Cámaras Simuladas (Landmarks)
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
            pi_id: item.id, // ID para actualizaciones
            id: item.usuario.id,
            nombre_completo: `${item.usuario.nombres} ${item.usuario.apellido_paterno} ${item.usuario.apellido_materno || ''}`.trim(),
            numero_documento: item.usuario.numero_documento,
            foto_principal: item.usuario.fotos.length > 0 ? item.usuario.fotos[0].base64 : null,
            fotos_count: item.usuario.fotos.length,
            motor: item.motor || 0,
            estaEnEscena: false,
            timeoutEscena: null
          }));
        }
      },
      error: (err: any) => console.error('Error al cargar objetivos desde DB', err)
    });
  }

  cambiarMotor(persona: any) {
    const nuevoValor = persona.motor === 0 ? 1 : 0;
    this.usuariosService.updatePersonaInteres(persona.pi_id, { motor: nuevoValor }).subscribe({
      next: () => {
        persona.motor = nuevoValor;
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Cambiado a Modo ${nuevoValor === 1 ? 'Masivo' : 'Estándar'}`,
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: () => console.error('Error al cambiar motor')
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
        enAlerta: false,
        motor: (i % 2 === 0) ? 1 : 0 // Cámara 1: Estándar (0), Cámara 2: Masivo (1)...
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
    // Generamos puntos agrupados en un área que simule un rostro
    const points = [];
    const offsetX = 0.35 + Math.random() * 0.1; // Posición X base variable
    const offsetY = 0.25 + Math.random() * 0.1; // Posición Y base variable

    for (let i = 0; i < 40; i++) {
      // Puntos en un radio elíptico para simular forma de cara
      points.push({
        x: offsetX + Math.random() * 0.2,
        y: offsetY + Math.random() * 0.3
      });
    }
    return points;
  }

  irAPersonasInteres() {
    this.router.navigate(['/app/reconocimiento/personas-interes']);
  }

  ngOnDestroy(): void {
    if (this.faceMesh) {
      this.faceMesh.close();
    }
    // Limpiamos los intervalos si es necesario
  }
}
