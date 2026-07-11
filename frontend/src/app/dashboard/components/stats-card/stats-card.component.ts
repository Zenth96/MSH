import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderOpen, lucideBox, lucideHardDrive } from '@ng-icons/lucide';

const iconMap: Record<string, string> = {
  folder: 'lucideFolderOpen',
  box: 'lucideBox',
  harddrive: 'lucideHardDrive',
};

const allIcons = { lucideFolderOpen, lucideBox, lucideHardDrive };

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons(allIcons)],
  template: `
    <div class="bg-card border-border rounded-xl border p-5 transition-colors hover:shadow-sm">
      <div class="flex items-center justify-between">
        <p class="text-muted-foreground text-sm font-medium">{{ label() }}</p>
        <ng-icon [name]="iconName" [class]="color()" class="h-5 w-5" />
      </div>
      <p class="mt-2 text-2xl font-bold tracking-tight">{{ value() }}</p>
    </div>
  `,
})
export class StatsCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  icon = input<string>('folder');
  color = input<string>('text-muted-foreground');

  get iconName(): string {
    return iconMap[this.icon()] ?? 'lucideFolderOpen';
  }
}
