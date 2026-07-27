import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { AssetService } from '@features/assets/asset/services/asset.service';
import { iAssetSummaryResponse } from '@features/assets/asset/interfaces/asset-summary-response';
import { getCategorySlot } from '@shared/constants/category-color.map';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { SessionService } from '@features/identity/auth/session/services/session.service';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-browse-assets',
  standalone: true,
  imports: [FormsModule, DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './browse.html',
})
export class BrowseAssetsPage {
  private readonly _categoryService = inject(CategoryService);
  private readonly _assetService = inject(AssetService);
  private readonly _sessionService = inject(SessionService);

  protected readonly isAuthenticated = this._sessionService.isAuthenticated;

  protected readonly categories = signal<iCategoryResponse[]>([]);
  protected readonly items = signal<iAssetSummaryResponse[]>([]);
  protected readonly nextPageToken = signal<string | null>(null);

  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<iClassifiedHttpError | null>(null);

  protected categoryId = '';
  protected keyword = '';
  protected minPrice: number | null = null;
  protected maxPrice: number | null = null;

  constructor() {
    this._categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });

    this._search(false);
  }

  protected categoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? categoryId;
  }

  protected categoryBadgeStyle(categoryId: string): Record<string, string> {
    const slot = getCategorySlot(this.categoryName(categoryId));
    return {
      'background-color': `var(--color-${slot.bgToken})`,
      color: `var(--color-${slot.textToken})`,
    };
  }

  protected onSearchSubmit(): void {
    this._search(false);
  }

  protected onLoadMore(): void {
    this._search(true);
  }

  private _search(append: boolean): void {
    if (append) {
      this.loadingMore.set(true);
    } else {
      this.loading.set(true);
      this.items.set([]);
      this.nextPageToken.set(null);
    }
    this.error.set(null);

    this._assetService
      .search({
        pageSize: PAGE_SIZE,
        nextPageToken: append ? (this.nextPageToken() ?? undefined) : undefined,
        categoryId: this.categoryId || undefined,
        minPrice: this.minPrice ?? undefined,
        maxPrice: this.maxPrice ?? undefined,
        keyword: this.keyword || undefined,
      })
      .subscribe({
        next: (response) => {
          this.items.update((current) => (append ? [...current, ...response.items] : response.items));
          this.nextPageToken.set(response.nextPageToken);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: (classified: iClassifiedHttpError) => {
          this.error.set(classified);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }
}
