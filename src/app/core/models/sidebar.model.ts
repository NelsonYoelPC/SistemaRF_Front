import { UserRole } from '../types/user-role.type';

export interface SidebarItem {
    id: string;
    label: string;
    icon: string;
    route?: string;
    roles: UserRole[];
    children?: SidebarItem[];
}

export interface SidebarGroup {
    id: string;
    title: string;
    items: SidebarItem[];
}