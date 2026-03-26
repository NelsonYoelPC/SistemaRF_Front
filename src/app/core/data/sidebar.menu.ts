import { SidebarGroup } from '../models/sidebar.model';
import { UserRole } from '../types/user-role.type';

export const SIDEBAR_GROUPS: SidebarGroup[] = [
    {
        id: 'inicio',
        title: 'Inicio',
        items: [
            {
                id: 'dashboard',
                label: 'Panel principal',
                icon: 'bi bi-speedometer2',
                route: '/dashboard',
                roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD']
            },
            {
                id: 'indicadores-criticos',
                label: 'Indicadores críticos',
                icon: 'bi bi-graph-up-arrow',
                route: '/indicadores-criticos',
                roles: ['JEFE_SEGURIDAD']
            },
            {
                id: 'salud-plataforma',
                label: 'Salud de la plataforma',
                icon: 'bi bi-hdd-network',
                route: '/salud-plataforma',
                roles: ['ADMINISTRADOR']
            }
        ]
    },
    {
        id: 'operaciones',
        title: 'Operaciones',
        items: [
            {
                id: 'monitoreo',
                label: 'Monitoreo',
                icon: 'bi bi-camera-video',
                roles: ['JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD'],
                children: [
                    {
                        id: 'monitoreo-en-vivo',
                        label: 'Monitoreo en vivo',
                        icon: 'bi bi-broadcast',
                        route: '/monitoreo/en-vivo',
                        roles: ['JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'camaras-asignadas',
                        label: 'Cámaras asignadas',
                        icon: 'bi bi-camera-video-fill',
                        route: '/monitoreo/camaras-asignadas',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'estado-camaras',
                        label: 'Estado de cámaras',
                        icon: 'bi bi-display',
                        route: '/monitoreo/estado-camaras',
                        roles: ['JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD']
                    }
                ]
            },
            {
                id: 'alertas',
                label: 'Alertas',
                icon: 'bi bi-bell',
                roles: ['JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD'],
                children: [
                    {
                        id: 'alertas-activas',
                        label: 'Alertas activas',
                        icon: 'bi bi-bell-fill',
                        route: '/alertas/activas',
                        roles: ['JEFE_SEGURIDAD']
                    },
                    {
                        id: 'alertas-nuevas',
                        label: 'Alertas nuevas',
                        icon: 'bi bi-exclamation-circle',
                        route: '/alertas/nuevas',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'alertas-evaluacion',
                        label: 'En evaluación',
                        icon: 'bi bi-hourglass-split',
                        route: '/alertas/evaluacion',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'alertas-confirmadas',
                        label: 'Confirmadas',
                        icon: 'bi bi-check-circle',
                        route: '/alertas/confirmadas',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'alertas-descartadas',
                        label: 'Descartadas',
                        icon: 'bi bi-x-circle',
                        route: '/alertas/descartadas',
                        roles: ['ANALISTA_SEGURIDAD']
                    }
                ]
            },
            {
                id: 'incidentes',
                label: 'Incidentes',
                icon: 'bi bi-exclamation-octagon',
                roles: ['JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD'],
                children: [
                    {
                        id: 'bandeja-incidentes',
                        label: 'Bandeja de incidentes',
                        icon: 'bi bi-list-task',
                        route: '/incidentes/bandeja',
                        roles: ['JEFE_SEGURIDAD']
                    },
                    {
                        id: 'asignacion-seguimiento',
                        label: 'Asignación y seguimiento',
                        icon: 'bi bi-diagram-3',
                        route: '/incidentes/asignacion-seguimiento',
                        roles: ['JEFE_SEGURIDAD']
                    },
                    {
                        id: 'cierre-incidentes',
                        label: 'Cierre de incidentes',
                        icon: 'bi bi-check2-square',
                        route: '/incidentes/cierre',
                        roles: ['JEFE_SEGURIDAD']
                    },
                    {
                        id: 'registrar-incidente',
                        label: 'Registrar incidente',
                        icon: 'bi bi-pencil-square',
                        route: '/incidentes/registrar',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'mis-incidentes',
                        label: 'Mis incidentes',
                        icon: 'bi bi-folder2-open',
                        route: '/incidentes/mis-incidentes',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'seguimiento-incidentes',
                        label: 'Seguimiento de incidentes',
                        icon: 'bi bi-arrow-repeat',
                        route: '/incidentes/seguimiento',
                        roles: ['ANALISTA_SEGURIDAD']
                    }
                ]
            }
        ]
    },
    {
        id: 'reconocimiento-facial',
        title: 'Reconocimiento facial',
        items: [
            {
                id: 'gestion-facial',
                label: 'Gestión facial',
                icon: 'bi bi-person-bounding-box',
                roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD'],
                children: [
                    {
                        id: 'coincidencias-detectadas',
                        label: 'Coincidencias detectadas',
                        icon: 'bi bi-search',
                        route: '/reconocimiento/coincidencias',
                        roles: ['JEFE_SEGURIDAD']
                    },
                    {
                        id: 'coincidencias-recientes',
                        label: 'Coincidencias recientes',
                        icon: 'bi bi-search-heart',
                        route: '/reconocimiento/coincidencias-recientes',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'verificacion-manual',
                        label: 'Verificación manual',
                        icon: 'bi bi-person-check',
                        route: '/reconocimiento/verificacion-manual',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'busquedas-avanzadas',
                        label: 'Búsquedas avanzadas',
                        icon: 'bi bi-funnel',
                        route: '/reconocimiento/busquedas-avanzadas',
                        roles: ['JEFE_SEGURIDAD']
                    },
                    {
                        id: 'busqueda-por-filtros',
                        label: 'Búsqueda por filtros',
                        icon: 'bi bi-sliders',
                        route: '/reconocimiento/busqueda-filtros',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'personas-interes',
                        label: 'Personas de interés',
                        icon: 'bi bi-people',
                        route: '/reconocimiento/personas-interes',
                        roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'historial-detecciones',
                        label: 'Historial de detecciones',
                        icon: 'bi bi-clock-history',
                        route: '/reconocimiento/historial-detecciones',
                        roles: ['JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'alta-registros-faciales',
                        label: 'Alta de registros faciales',
                        icon: 'bi bi-person-plus',
                        route: '/reconocimiento/alta-registros',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'actualizacion-registros-faciales',
                        label: 'Actualización de registros',
                        icon: 'bi bi-pencil',
                        route: '/reconocimiento/actualizacion-registros',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'depuracion-registros',
                        label: 'Depuración / inhabilitación',
                        icon: 'bi bi-trash3',
                        route: '/reconocimiento/depuracion-registros',
                        roles: ['ADMINISTRADOR']
                    }
                ]
            }
        ]
    },
    {
        id: 'reportes',
        title: 'Reportes',
        items: [
            {
                id: 'reportes-operativos',
                label: 'Reportes',
                icon: 'bi bi-file-earmark-bar-graph',
                roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD'],
                children: [
                    {
                        id: 'reporte-operativo-diario',
                        label: 'Reporte operativo diario',
                        icon: 'bi bi-journal-text',
                        route: '/reportes/operativo-diario',
                        roles: ['JEFE_SEGURIDAD']
                    },
                    {
                        id: 'reporte-alertas',
                        label: 'Reporte de alertas',
                        icon: 'bi bi-file-earmark-medical',
                        route: '/reportes/alertas',
                        roles: ['JEFE_SEGURIDAD', 'ADMINISTRADOR']
                    },
                    {
                        id: 'reporte-incidencias',
                        label: 'Reporte de incidencias',
                        icon: 'bi bi-file-earmark-break',
                        route: '/reportes/incidencias',
                        roles: ['JEFE_SEGURIDAD', 'ADMINISTRADOR']
                    },
                    {
                        id: 'reporte-detecciones',
                        label: 'Reporte de detecciones faciales',
                        icon: 'bi bi-file-earmark-person',
                        route: '/reportes/detecciones-faciales',
                        roles: ['JEFE_SEGURIDAD', 'ADMINISTRADOR']
                    },
                    {
                        id: 'consulta-detecciones',
                        label: 'Consulta de detecciones',
                        icon: 'bi bi-table',
                        route: '/consultas/detecciones',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'consulta-persona',
                        label: 'Consulta por persona',
                        icon: 'bi bi-person-vcard',
                        route: '/consultas/persona',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'consulta-camara',
                        label: 'Consulta por cámara',
                        icon: 'bi bi-camera',
                        route: '/consultas/camara',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'consulta-fecha-hora',
                        label: 'Consulta por fecha y hora',
                        icon: 'bi bi-calendar3',
                        route: '/consultas/fecha-hora',
                        roles: ['ANALISTA_SEGURIDAD']
                    },
                    {
                        id: 'exportaciones',
                        label: 'Exportaciones',
                        icon: 'bi bi-download',
                        route: '/reportes/exportaciones',
                        roles: ['JEFE_SEGURIDAD', 'ADMINISTRADOR']
                    }
                ]
            }
        ]
    },
    {
        id: 'auditoria',
        title: 'Auditoría',
        items: [
            {
                id: 'auditoria-sistema',
                label: 'Auditoría',
                icon: 'bi bi-clipboard-data',
                roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD'],
                children: [
                    {
                        id: 'bitacora-accesos',
                        label: 'Bitácora de accesos',
                        icon: 'bi bi-shield-lock',
                        route: '/auditoria/bitacora-accesos',
                        roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD']
                    },
                    {
                        id: 'acciones-usuarios',
                        label: 'Acciones de usuarios',
                        icon: 'bi bi-person-lines-fill',
                        route: '/auditoria/acciones-usuarios',
                        roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD']
                    },
                    {
                        id: 'eventos-sistema',
                        label: 'Eventos del sistema',
                        icon: 'bi bi-cpu',
                        route: '/auditoria/eventos-sistema',
                        roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD']
                    }
                ]
            }
        ]
    },
    {
        id: 'administracion',
        title: 'Administración',
        items: [
            {
                id: 'gestion-usuarios',
                label: 'Gestión de usuarios',
                icon: 'bi bi-people-fill',
                roles: ['ADMINISTRADOR'],
                children: [
                    {
                        id: 'usuarios',
                        label: 'Usuarios',
                        icon: 'bi bi-person',
                        route: '/administracion/usuarios',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'roles',
                        label: 'Roles',
                        icon: 'bi bi-person-gear',
                        route: '/administracion/roles',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'permisos',
                        label: 'Permisos',
                        icon: 'bi bi-key',
                        route: '/administracion/permisos',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'asignacion-accesos',
                        label: 'Asignación de accesos',
                        icon: 'bi bi-person-check-fill',
                        route: '/administracion/asignacion-accesos',
                        roles: ['ADMINISTRADOR']
                    }
                ]
            },
            {
                id: 'configuracion-sistema',
                label: 'Configuración del sistema',
                icon: 'bi bi-gear',
                roles: ['ADMINISTRADOR'],
                children: [
                    {
                        id: 'parametros-generales',
                        label: 'Parámetros generales',
                        icon: 'bi bi-sliders2',
                        route: '/configuracion/parametros-generales',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'catalogos',
                        label: 'Catálogos',
                        icon: 'bi bi-card-list',
                        route: '/configuracion/catalogos',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'tipos-alerta',
                        label: 'Tipos de alerta',
                        icon: 'bi bi-bell-fill',
                        route: '/configuracion/tipos-alerta',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'estados-incidente',
                        label: 'Estados de incidente',
                        icon: 'bi bi-flag',
                        route: '/configuracion/estados-incidente',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'umbrales-reconocimiento',
                        label: 'Umbrales de reconocimiento',
                        icon: 'bi bi-percent',
                        route: '/configuracion/umbrales-reconocimiento',
                        roles: ['ADMINISTRADOR']
                    }
                ]
            },
            {
                id: 'infraestructura',
                label: 'Infraestructura',
                icon: 'bi bi-hdd-rack',
                roles: ['ADMINISTRADOR'],
                children: [
                    {
                        id: 'camaras',
                        label: 'Cámaras',
                        icon: 'bi bi-camera-video',
                        route: '/infraestructura/camaras',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'servidores-nvr',
                        label: 'Servidores / NVR',
                        icon: 'bi bi-server',
                        route: '/infraestructura/servidores-nvr',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'ubicaciones',
                        label: 'Ubicaciones',
                        icon: 'bi bi-geo-alt',
                        route: '/infraestructura/ubicaciones',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'dispositivos-vinculados',
                        label: 'Dispositivos vinculados',
                        icon: 'bi bi-diagram-2',
                        route: '/infraestructura/dispositivos-vinculados',
                        roles: ['ADMINISTRADOR']
                    }
                ]
            },
            {
                id: 'integraciones',
                label: 'Integraciones',
                icon: 'bi bi-plug',
                roles: ['ADMINISTRADOR'],
                children: [
                    {
                        id: 'api-servicios-externos',
                        label: 'API y servicios externos',
                        icon: 'bi bi-cloud-arrow-up',
                        route: '/integraciones/api-servicios-externos',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'sincronizaciones',
                        label: 'Sincronizaciones',
                        icon: 'bi bi-arrow-repeat',
                        route: '/integraciones/sincronizaciones',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'logs-integracion',
                        label: 'Logs de integración',
                        icon: 'bi bi-journal-code',
                        route: '/integraciones/logs',
                        roles: ['ADMINISTRADOR']
                    }
                ]
            },
            {
                id: 'respaldos-mantenimiento',
                label: 'Respaldos y mantenimiento',
                icon: 'bi bi-tools',
                roles: ['ADMINISTRADOR'],
                children: [
                    {
                        id: 'copias-seguridad',
                        label: 'Copias de seguridad',
                        icon: 'bi bi-safe2',
                        route: '/mantenimiento/copias-seguridad',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'restauracion',
                        label: 'Restauración',
                        icon: 'bi bi-bootstrap-reboot',
                        route: '/mantenimiento/restauracion',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'tareas-programadas',
                        label: 'Tareas programadas',
                        icon: 'bi bi-clock',
                        route: '/mantenimiento/tareas-programadas',
                        roles: ['ADMINISTRADOR']
                    },
                    {
                        id: 'mantenimiento-plataforma',
                        label: 'Mantenimiento',
                        icon: 'bi bi-wrench-adjustable',
                        route: '/mantenimiento/plataforma',
                        roles: ['ADMINISTRADOR']
                    }
                ]
            }
        ]
    },
    {
        id: 'mi-cuenta',
        title: 'Mi cuenta',
        items: [
            {
                id: 'perfil',
                label: 'Mi perfil',
                icon: 'bi bi-person-circle',
                route: '/mi-cuenta/perfil',
                roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD']
            },
            {
                id: 'cambio-clave',
                label: 'Cambio de contraseña',
                icon: 'bi bi-shield-lock-fill',
                route: '/mi-cuenta/cambio-clave',
                roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD']
            },
            {
                id: 'cerrar-sesion',
                label: 'Cerrar sesión',
                icon: 'bi bi-box-arrow-right',
                route: '/logout',
                roles: ['ADMINISTRADOR', 'JEFE_SEGURIDAD', 'ANALISTA_SEGURIDAD']
            }
        ]
    }
];

export function getSidebarByRole(role: UserRole): SidebarGroup[] {
    return SIDEBAR_GROUPS
        .map((group) => {
            const filteredItems = group.items
                .map((item) => {
                    const filteredChildren = item.children?.filter((child) =>
                        child.roles.includes(role)
                    );

                    const canSeeParent =
                        item.roles.includes(role) || (filteredChildren?.length ?? 0) > 0;

                    if (!canSeeParent) {
                        return null;
                    }

                    return {
                        ...item,
                        children: filteredChildren
                    };
                })
                .filter((item): item is NonNullable<typeof item> => item !== null);

            return {
                ...group,
                items: filteredItems
            };
        })
        .filter((group) => group.items.length > 0);
}