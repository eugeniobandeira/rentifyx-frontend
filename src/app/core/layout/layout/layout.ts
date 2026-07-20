import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from '@core/layout/header/header';
import { Footer } from '@core/layout/footer/footer';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [Header, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout.html',
})
export class Layout {}
