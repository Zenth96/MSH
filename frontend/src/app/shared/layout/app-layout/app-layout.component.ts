import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HlmToaster } from '@spartan-ng/helm/sonner';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HlmToaster],
  template: `
    <div class="flex min-h-dvh">
      <app-sidebar />
      <main class="flex-1 min-w-0 overflow-auto">
        <router-outlet />
      </main>
      <hlm-toaster richColors />
    </div>
  `,
})
export class AppLayoutComponent {}
