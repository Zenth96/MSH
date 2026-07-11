import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLock, lucideHome, lucideLogIn } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-not-authenticated',
  standalone: true,
  imports: [RouterLink, NgIcon, HlmButton],
  viewProviders: [provideIcons({ lucideLock, lucideHome, lucideLogIn })],
  template: `
    <div class="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div class="bg-muted flex h-20 w-20 items-center justify-center rounded-2xl">
        <ng-icon name="lucideLock" class="text-muted-foreground h-10 w-10" />
      </div>
      <h1 class="text-foreground mt-6 text-2xl font-bold tracking-tight">Nem vagy bejelentkezve</h1>
      <p class="text-muted-foreground mt-2 max-w-sm text-sm">
        A tartalom megtekintéséhez jelentkezz be a fiókoddal.
      </p>
      <div class="mt-8 flex items-center gap-3">
        <button
          hlmBtn
          variant="outline"
          disabled
          class="opacity-50 cursor-not-allowed"
        >
          <ng-icon name="lucideHome" class="mr-2 h-4 w-4" />
          Főoldal
        </button>
        <a hlmBtn routerLink="/auth/login">
          <ng-icon name="lucideLogIn" class="mr-2 h-4 w-4" />
          Bejelentkezés
        </a>
      </div>
    </div>
  `,
})
export class NotAuthenticatedComponent {}
