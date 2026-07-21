import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBox,
  lucideUpload,
  lucideFolderOpen,
  lucideHardDrive,
  lucideCheck,
  lucideArrowRight,
  lucideMenu,
  lucideX,
  lucideLayoutDashboard,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NgIcon, HlmButton],
  viewProviders: [
    provideIcons({
      lucideBox,
      lucideUpload,
      lucideFolderOpen,
      lucideHardDrive,
      lucideCheck,
      lucideArrowRight,
      lucideMenu,
      lucideX,
      lucideLayoutDashboard,
    }),
  ],
  template: `
    <style>
      .scene { perspective: 800px; }
      .cube-float {
        animation: float 4s ease-in-out infinite;
      }
      .cube-spin {
        transform-style: preserve-3d;
        animation: spin 16s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }
      .face {
        backface-visibility: hidden;
        position: absolute;
        width: 160px;
        height: 160px;
      }
      @keyframes spin {
        0% { transform: rotateX(-24deg) rotateY(0deg); }
        25% { transform: rotateX(-24deg) rotateY(90deg); }
        50% { transform: rotateX(-24deg) rotateY(180deg); }
        75% { transform: rotateX(-24deg) rotateY(270deg); }
        to { transform: rotateX(-24deg) rotateY(360deg); }
      }
      @keyframes float {
        0%, to { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      .shadow-glow {
        box-shadow: 0 0 60px -12px color-mix(in oklch, var(--primary) 25%, transparent);
      }
    </style>

    <div class="flex min-h-dvh flex-col bg-background">
      <!-- Navbar -->
      <header class="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div class="flex items-center gap-2.5">
            <img src="logo.png" alt="MSH" class="h-7 w-7 object-contain" />
            <span class="text-foreground text-lg font-semibold tracking-tight">MSH</span>
          </div>

          <nav class="hidden items-center gap-6 sm:flex">
            <a href="#features" class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Features</a>
            @if (loggedIn()) {
              <a routerLink="/app/dashboard" hlmBtn size="sm" class="bg-primary text-primary-foreground hover:bg-primary/90">
                <ng-icon name="lucideLayoutDashboard" class="mr-1.5 h-4 w-4" />
                Dashboard
              </a>
            } @else {
              <a routerLink="/auth/login" class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">Login</a>
              <a routerLink="/auth/register" hlmBtn size="sm">Get started</a>
            }
          </nav>

          <button class="sm:hidden" (click)="mobileNav.set(!mobileNav())">
            @if (mobileNav()) {
              <ng-icon name="lucideX" class="h-5 w-5" />
            } @else {
              <ng-icon name="lucideMenu" class="h-5 w-5" />
            }
          </button>
        </div>

        @if (mobileNav()) {
          <nav class="border-t border-border px-6 py-4 sm:hidden">
            <div class="flex flex-col gap-3">
              <a href="#features" class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors" (click)="mobileNav.set(false)">Features</a>
              @if (loggedIn()) {
                <a routerLink="/app/dashboard" hlmBtn size="sm" class="w-full bg-primary text-primary-foreground hover:bg-primary/90" (click)="mobileNav.set(false)">
                  <ng-icon name="lucideLayoutDashboard" class="mr-1.5 h-4 w-4" />
                  Dashboard
                </a>
              } @else {
                <a routerLink="/auth/login" class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors" (click)="mobileNav.set(false)">Login</a>
                <a routerLink="/auth/register" hlmBtn size="sm" class="w-full" (click)="mobileNav.set(false)">Get started</a>
              }
            </div>
          </nav>
        }
      </header>

      <!-- Hero -->
      <section class="flex-1">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-16 lg:flex-row lg:py-24">

          <!-- Hero text -->
          <div class="flex-1 text-center lg:text-left">
            <div class="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span class="text-primary">v1.0</span>
              &mdash; Platform Preview
            </div>
            <h1 class="text-foreground mb-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Manage your
              <br />
              <span class="text-primary">3D models</span>.
              <br />
              Ship faster.
            </h1>
            <p class="text-muted-foreground mx-auto mb-8 max-w-md text-base leading-relaxed lg:mx-0">
              Upload, organize, and preview 3D models in any format.
              Built for artists, designers, and teams who work with 3D content.
            </p>
            <div class="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              @if (loggedIn()) {
                <a routerLink="/app/dashboard" hlmBtn size="lg" class="w-full sm:w-auto">
                  <ng-icon name="lucideLayoutDashboard" class="mr-2 h-4 w-4" />
                  Go to Dashboard
                </a>
              } @else {
                <a routerLink="/auth/register" hlmBtn size="lg" class="w-full sm:w-auto">
                  Get started free
                  <ng-icon name="lucideArrowRight" class="ml-2 h-4 w-4" />
                </a>
                <a routerLink="/auth/login" hlmBtn variant="outline" size="lg" class="w-full sm:w-auto">
                  Sign in
                </a>
              }
            </div>
          </div>

          <!-- CSS 3D Cube -->
          <div class="scene relative flex h-64 w-64 shrink-0 items-center justify-center">
            <div class="cube-float">
              <div class="cube-spin relative h-40 w-40">
                <div class="face flex items-center justify-center rounded-2xl border border-border bg-card shadow-glow" style="transform: translateZ(80px);">
                  <img src="logo.png" alt="MSH" class="h-12 w-12 object-contain" />
                </div>
                <div class="face flex items-center justify-center rounded-2xl border border-border bg-card" style="transform: rotateY(180deg) translateZ(80px);">
                  <ng-icon name="lucideBox" class="text-primary h-10 w-10" />
                </div>
                <div class="face flex items-center justify-center rounded-2xl border border-border bg-card" style="transform: rotateY(-90deg) translateZ(80px);">
                  <ng-icon name="lucideUpload" class="text-primary h-10 w-10" />
                </div>
                <div class="face flex items-center justify-center rounded-2xl border border-border bg-card" style="transform: rotateY(90deg) translateZ(80px);">
                  <ng-icon name="lucideFolderOpen" class="text-primary h-10 w-10" />
                </div>
                <div class="face flex items-center justify-center rounded-2xl border border-border bg-card" style="transform: rotateX(90deg) translateZ(80px);">
                  <ng-icon name="lucideCheck" class="text-primary h-10 w-10" />
                </div>
                <div class="face flex items-center justify-center rounded-2xl border border-border bg-card" style="transform: rotateX(-90deg) translateZ(80px);">
                  <ng-icon name="lucideHardDrive" class="text-primary h-10 w-10" />
                </div>
              </div>
            </div>

            <div class="absolute bottom-0 left-1/2 h-4 w-32 -translate-x-1/2 rounded-full opacity-20" style="background: radial-gradient(ellipse, var(--primary), transparent 70%);"></div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="border-t border-border">
        <div class="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div class="mb-12 text-center">
            <h2 class="text-foreground mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to manage 3D assets
            </h2>
            <p class="text-muted-foreground mx-auto max-w-lg text-sm leading-relaxed">
              From upload to preview, MSH handles the pipeline so you can focus on creating.
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <div class="bg-primary/10 mb-4 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-primary/20">
                <ng-icon name="lucideUpload" class="text-primary h-5 w-5" />
              </div>
              <h3 class="text-foreground mb-2 text-sm font-semibold">Upload & store</h3>
              <p class="text-muted-foreground text-xs leading-relaxed">
                Drag and drop GLB, GLTF, OBJ, and FBX files. Automatic format detection and ref file handling.
              </p>
            </div>

            <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <div class="bg-primary/10 mb-4 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-primary/20">
                <ng-icon name="lucideBox" class="text-primary h-5 w-5" />
              </div>
              <h3 class="text-foreground mb-2 text-sm font-semibold">Auto thumbnails</h3>
              <p class="text-muted-foreground text-xs leading-relaxed">
                Every model gets an automatic preview image generated by our headless 3D renderer.
              </p>
            </div>

            <div class="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <div class="bg-primary/10 mb-4 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-primary/20">
                <ng-icon name="lucideFolderOpen" class="text-primary h-5 w-5" />
              </div>
              <h3 class="text-foreground mb-2 text-sm font-semibold">Organize by project</h3>
              <p class="text-muted-foreground text-xs leading-relaxed">
                Group models into projects, filter by status, and keep your workspace clean.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="bg-primary/5 border-t border-border">
        <div class="mx-auto max-w-6xl px-6 py-16 text-center lg:py-20">
          <h2 class="text-foreground mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Start managing your 3D assets today
          </h2>
          <p class="text-muted-foreground mx-auto mb-8 max-w-md text-sm leading-relaxed">
            Sign up free — no credit card required. Your models, always accessible.
          </p>
          @if (loggedIn()) {
            <a routerLink="/app/dashboard" hlmBtn size="lg">
              <ng-icon name="lucideLayoutDashboard" class="mr-2 h-4 w-4" />
              Go to Dashboard
            </a>
          } @else {
            <a routerLink="/auth/register" hlmBtn size="lg">
              Create free account
              <ng-icon name="lucideArrowRight" class="ml-2 h-4 w-4" />
            </a>
          }
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-border py-8">
        <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div class="flex items-center gap-2.5">
            <img src="logo.png" alt="MSH" class="h-6 w-6 object-contain opacity-60" />
            <span class="text-muted-foreground text-sm font-medium">MSH</span>
          </div>
          <p class="text-muted-foreground text-xs">&copy; 2026 MSH. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
})
export class LandingComponent implements OnInit {
  private auth = inject(AuthService);

  mobileNav = signal(false);
  loggedIn = signal(false);

  ngOnInit(): void {
    this.auth.isLoggedIn$.subscribe((v) => this.loggedIn.set(v));
  }
}
