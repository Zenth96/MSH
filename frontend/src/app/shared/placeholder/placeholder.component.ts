import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideConstruction,
  lucideBox,
  lucideFolderOpen,
  lucideShield,
  lucideUpload,
} from '@ng-icons/lucide';

const iconMap: Record<string, string> = {
  construction: 'lucideConstruction',
  box: 'lucideBox',
  folder: 'lucideFolderOpen',
  shield: 'lucideShield',
  upload: 'lucideUpload',
};

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      lucideConstruction,
      lucideBox,
      lucideFolderOpen,
      lucideShield,
      lucideUpload,
    }),
  ],
  template: `
    <div class="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div class="bg-muted flex h-20 w-20 items-center justify-center rounded-2xl">
        <ng-icon [name]="iconName" class="text-muted-foreground h-10 w-10" />
      </div>
      <h2 class="text-foreground mt-6 text-xl font-semibold">{{ title() }}</h2>
      <p class="text-muted-foreground mt-2 max-w-sm text-sm">
        {{ description() }}
      </p>
      <div class="bg-primary/10 text-primary mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
        Coming Soon
      </div>
    </div>
  `,
})
export class PlaceholderComponent implements OnInit {
  private route = inject(ActivatedRoute);

  title = signal('Coming Soon');
  description = signal('This feature is under development. Check back later!');
  icon = signal('construction');

  get iconName(): string {
    return iconMap[this.icon()] ?? 'lucideConstruction';
  }

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    if (data['title']) this.title.set(data['title']);
    if (data['description']) this.description.set(data['description']);
    if (data['icon']) this.icon.set(data['icon']);
  }
}
