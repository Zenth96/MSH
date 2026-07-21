import { Component, inject, signal, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMailCheck, lucideLoader } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
    HlmCardImports,
    HlmLabel,
    HlmInput,
    HlmButton,
    HlmSpinner,
  ],
  viewProviders: [provideIcons({ lucideMailCheck, lucideLoader })],
  templateUrl: './verify.component.html',
})
export class VerifyComponent implements AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  email = signal('');
  code = ['', '', '', '', '', ''];
  loading = signal(false);
  resending = signal(false);
  error = '';
  success = '';
  countdown = signal(0);
  countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email.set(params['email']);
      }
    });

    setTimeout(() => this.focusInput(0), 100);
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    this.code[index] = value;

    if (value && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.code[index] && index > 0) {
      this.focusInput(index - 1);
    }
    if (event.key === 'Enter') {
      this.submit();
    }
  }

  onPaste(event: ClipboardEvent) {
    const data = event.clipboardData?.getData('text').replace(/[^0-9]/g, '');
    if (!data) return;
    event.preventDefault();

    for (let i = 0; i < Math.min(data.length, 6); i++) {
      this.code[i] = data[i];
    }

    const nextIndex = Math.min(data.length, 5);
    this.focusInput(nextIndex);
  }

  submit() {
    if (this.code.some(d => !d) || !this.email()) return;
    this.error = '';
    this.success = '';
    this.loading.set(true);

    this.auth.verifyEmail(this.email(), this.code.join('')).subscribe({
      next: () => {
        this.loading.set(false);
        this.success = 'Email verified successfully!';
        setTimeout(() => this.router.navigate(['/app/dashboard']), 1000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error = err.error?.message || 'Verification failed';
        if (this.error?.includes('expired') || this.error?.includes('Too many')) {
          this.code.fill('');
        }
      },
    });
  }

  resendCode() {
    if (!this.email() || this.countdown() > 0) return;
    this.resending.set(true);
    this.error = '';

    this.auth.sendVerifyCode(this.email()).subscribe({
      next: () => {
        this.resending.set(false);
        this.code.fill('');
        this.error = '';
        this.startCountdown();
      },
      error: (err) => {
        this.resending.set(false);
        this.error = err.error?.message || 'Failed to resend code';
      },
    });
  }

  private focusInput(index: number) {
    const inputs = this.codeInputs?.toArray();
    if (inputs?.[index]) {
      inputs[index].nativeElement.focus();
    }
  }

  private startCountdown() {
    this.countdown.set(30);
    this.countdownInterval = setInterval(() => {
      this.countdown.update(v => {
        if (v <= 1) {
          if (this.countdownInterval) clearInterval(this.countdownInterval);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }
}
