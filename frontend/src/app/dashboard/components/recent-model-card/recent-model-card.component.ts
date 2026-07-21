import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBox } from '@ng-icons/lucide';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-recent-model-card',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideBox })],
  template: `
    <div class="bg-card border-border group cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md">
      <!-- Thumbnail -->
      <div class="bg-muted flex aspect-video items-center justify-center rounded-lg overflow-hidden">
        @if (thumbnailUrl()) {
          <img [src]="thumbnailUrl()" [alt]="name()" class="h-full w-full object-cover" />
        } @else {
          <ng-icon name="lucideBox" class="text-muted-foreground h-10 w-10" />
        }
      </div>

      <!-- Info -->
      <div class="mt-3 space-y-1.5">
        <h3 class="text-foreground truncate text-sm font-semibold">{{ name() }}</h3>
        <p class="text-muted-foreground truncate text-xs">{{ projectName() }}</p>

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground text-xs">{{ format() }} · {{ fileSize() }}</span>
          <span
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            [class]="statusClasses()"
          >
            {{ status() }}
          </span>
        </div>
      </div>
    </div>
  `,
})
export class RecentModelCardComponent implements OnInit {
  private api = inject(ApiService);

  name = input.required<string>();
  projectName = input.required<string>();
  format = input.required<string>();
  fileSize = input.required<string>();
  status = input.required<'READY' | 'PROCESSING' | 'ERROR'>();
  modelId = input<string>('');

  thumbnailUrl = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.modelId();
    if (id) {
      this.api.getThumbnailUrl(id).subscribe({
        next: (url) => this.thumbnailUrl.set(url),
        error: () => this.thumbnailUrl.set(null),
      });
    }
  }

  statusClasses(): string {
    switch (this.status()) {
      case 'READY':
        return 'bg-emerald-500/10 text-emerald-600';
      case 'PROCESSING':
        return 'bg-amber-500/10 text-amber-600';
      case 'ERROR':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }
}
