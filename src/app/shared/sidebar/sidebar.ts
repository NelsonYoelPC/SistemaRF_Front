import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SidebarGroup, SidebarItem } from '../../core/models/sidebar.model';
import { SessionService } from '../../core/services/session.service';
import { UserRole } from '../../core/types/user-role.type';
import { getSidebarByRole } from '../../core/data/sidebar.menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  collapsed = false;
  menuGroups: SidebarGroup[] = [];
  openMenus = new Set<string>();

  readonly roleLabels: Record<UserRole, string> = {
    ADMINISTRADOR: 'Administrador',
    JEFE_SEGURIDAD: 'Jefe de Seguridad',
    ANALISTA_SEGURIDAD: 'Analista de Seguridad'
  };

  constructor(
    private readonly router: Router,
    public readonly sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.loadMenu();
    this.expandMenusByActiveRoute();
  }

  get currentRoleLabel(): string {
    return this.roleLabels[this.sessionService.role];
  }

  loadMenu(): void {
    this.menuGroups = getSidebarByRole(this.sessionService.role);
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }

  toggleSubmenu(item: SidebarItem): void {
    if (!item.children?.length) {
      return;
    }

    if (this.collapsed) {
      this.collapsed = false;
    }

    if (this.openMenus.has(item.id)) {
      this.openMenus.delete(item.id);
      return;
    }

    this.openMenus.add(item.id);
  }

  isExpanded(itemId: string): boolean {
    return this.openMenus.has(itemId);
  }

  isRouteActive(route?: string): boolean {
    if (!route) {
      return false;
    }

    return this.router.url === route;
  }

  hasActiveChild(item: SidebarItem): boolean {
    return item.children?.some((child) => this.isRouteActive(child.route)) ?? false;
  }

  navigateTo(route?: string): void {
    if (!route) {
      return;
    }

    if (route === '/logout') {
      this.sessionService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate([route]);
  }

  expandMenusByActiveRoute(): void {
    for (const group of this.menuGroups) {
      for (const item of group.items) {
        if (item.children?.some((child) => this.isRouteActive(child.route))) {
          this.openMenus.add(item.id);
        }
      }
    }
  }

  trackByGroup(index: number, group: SidebarGroup): string {
    return group.id;
  }

  trackByItem(index: number, item: SidebarItem): string {
    return item.id;
  }
}