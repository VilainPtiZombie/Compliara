import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="shell">
      <!-- Sidebar -->
      <nav class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <span class="logo" *ngIf="!sidebarCollapsed()">
            <span class="logo-text">Compliara</span>
          </span>
          <p-button
            [icon]="sidebarCollapsed() ? 'pi pi-bars' : 'pi pi-times'"
            [text]="true"
            severity="secondary"
            (onClick)="toggleSidebar()"
          />
        </div>

        <ul class="nav-list">
          @for (item of navItems; track item.route) {
            <li>
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                [title]="sidebarCollapsed() ? item.label : ''"
              >
                <i [class]="'pi ' + item.icon"></i>
                <span *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
              </a>
            </li>
          }
        </ul>

        <div class="sidebar-footer" *ngIf="!sidebarCollapsed()">
          <span class="version">v0.1.0</span>
        </div>
      </nav>

      <!-- Contenu principal -->
      <div class="main">
        <header class="topbar">
          <div class="topbar-left">
            <span class="page-title"></span>
          </div>
          <div class="topbar-right">
            <p-button icon="pi pi-bell" [text]="true" severity="secondary" />
            <p-button icon="pi pi-user" [text]="true" severity="secondary" />
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--p-surface-50);
    }

    /* ── Sidebar ─────────────────────────── */
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: var(--p-surface-0);
      border-right: 1px solid var(--p-surface-200);
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease, min-width 0.2s ease;
      overflow: hidden;
    }

    .sidebar.collapsed {
      width: 64px;
      min-width: 64px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid var(--p-surface-200);
      min-height: 64px;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--p-primary-500);
      white-space: nowrap;
    }

    .nav-list {
      list-style: none;
      padding: 0.5rem;
      flex: 1;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 8px;
      color: var(--p-surface-700);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;

      &:hover {
        background: var(--p-surface-100);
        color: var(--p-primary-500);
      }

      &.active {
        background: var(--p-primary-50);
        color: var(--p-primary-600);
        font-weight: 600;
      }

      i {
        font-size: 1rem;
        min-width: 1rem;
        text-align: center;
      }
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--p-surface-200);
    }

    .version {
      font-size: 0.75rem;
      color: var(--p-surface-400);
    }

    /* ── Main ────────────────────────────── */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .topbar {
      height: 64px;
      background: var(--p-surface-0);
      border-bottom: 1px solid var(--p-surface-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      gap: 1rem;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }
  `],
})
export class ShellComponent {
  sidebarCollapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'pi-home', route: '/dashboard' },
    { label: 'Services', icon: 'pi-globe', route: '/services' },
    { label: 'Déclarations', icon: 'pi-file-check', route: '/declarations' },
    { label: 'Publication', icon: 'pi-send', route: '/declarations/publish' },
    { label: 'Planning', icon: 'pi-calendar', route: '/planning' },
  ];

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }
}
