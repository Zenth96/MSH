import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUpload } from '@ng-icons/lucide';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

@Component({
  selector: 'app-upload-button',
  standalone: true,
  imports: [NgIcon, HlmTooltipImports],
  viewProviders: [provideIcons({ lucideUpload })],
  template: `
    <button
      class="border-border bg-card hover:bg-accent text-foreground flex w-full flex-col items-center gap-3 rounded-xl border p-5 text-center transition-colors opacity-50 cursor-not-allowed"
      disabled
      [hlmTooltip]="'Upload flow coming soon'"
      [position]="'top'"
    >
      <div class="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
        <ng-icon name="lucideUpload" class="text-primary h-6 w-6" />
      </div>
      <div>
        <p class="text-sm font-semibold">Upload Model</p>
        <p class="text-muted-foreground text-xs">Drag & drop or click to upload (.glb, .gltf, .obj, .fbx)</p>
      </div>
    </button>
  `,
})
export class UploadButtonComponent {}
