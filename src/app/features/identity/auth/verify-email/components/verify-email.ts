import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VerifyEmailService } from '../services/verify-email.service';

type VerifyEmailStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verify-email.html',
})
export class VerifyEmailPage {
  private readonly _route = inject(ActivatedRoute);
  private readonly _verifyEmailService = inject(VerifyEmailService);

  protected readonly status = signal<VerifyEmailStatus>('loading');

  constructor() {
    const email = this._route.snapshot.queryParamMap.get('email');
    const token = this._route.snapshot.queryParamMap.get('token');

    if (!email || !token) {
      this.status.set('error');
      return;
    }

    this._verifyEmailService.verifyEmail({ email, token }).subscribe({
      next: () => this.status.set('success'),
      error: () => this.status.set('error'),
    });
  }
}
