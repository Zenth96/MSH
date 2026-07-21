import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBox } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, NgIcon, HlmButton],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideBox })],
  template: `
    <div class="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <img
        src="logo.png"
        alt="MSH"
        class="mb-8 h-10 w-10 object-contain opacity-40"
      />

      <div class="relative mb-8 select-none">
        <span
          class="text-[8rem] font-bold leading-none tracking-tighter"
          style="background: linear-gradient(135deg, var(--primary) 0%, oklch(0.45 0.18 285) 50%, oklch(0.55 0.2 250) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
        >
          404
        </span>
      </div>

      <div class="mb-2 flex items-center gap-2">
        <div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
          <ng-icon name="lucideBox" class="text-primary h-4 w-4" />
        </div>
        <span class="text-muted-foreground text-xs font-medium uppercase tracking-widest">Page not found</span>
      </div>

      <h1 class="text-foreground mb-2 text-xl font-semibold tracking-tight">
        This page doesn't exist
      </h1>

      <p class="text-muted-foreground mb-8 max-w-sm text-sm leading-relaxed">
        The page you're looking for has been moved, deleted, or never existed.
        Let's get you back on track.
      </p>

      <a routerLink="/app/dashboard" hlmBtn>
        <ng-icon name="lucideArrowLeft" class="mr-2 h-4 w-4" />
        Back to Dashboard
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
