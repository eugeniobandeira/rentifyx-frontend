import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssetService } from '@features/assets/asset/services/asset.service';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { iAdminAssetSummaryResponse } from '@features/assets/asset/interfaces/admin-asset-summary-response';
import { iGetAssetByIdResponse } from '@features/assets/asset/interfaces/get-asset-by-id-response';
import { AssetStatus } from '@features/assets/asset/types/asset-status';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';

const PAGE_SIZE = 12;

/**
 * Real review queue, backed by GET /assets/admin-search?status=PendingModeration - closes the
 * gap the earlier lookup-by-id version worked around (that endpoint didn't exist yet when this
 * page was first built).
 */
@Component({
  selector: 'app-admin-review-asset',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-review.html',
})
export class AdminReviewAssetPage {
  private readonly _assetService = inject(AssetService);
  private readonly _categoryService = inject(CategoryService);

  protected readonly categories = signal<iCategoryResponse[]>([]);
  protected readonly queue = signal<iAdminAssetSummaryResponse[]>([]);
  protected readonly nextPageToken = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly queueError = signal<iClassifiedHttpError | null>(null);

  protected readonly selected = signal<iGetAssetByIdResponse | null>(null);
  protected readonly selecting = signal(false);
  protected readonly selectError = signal<iClassifiedHttpError | null>(null);

  protected readonly reviewing = signal(false);
  protected readonly reviewError = signal<iClassifiedHttpError | null>(null);
  protected reason = '';

  constructor() {
    this._categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });

    this._loadQueue(false);
  }

  protected categoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? categoryId;
  }

  protected onLoadMore(): void {
    this._loadQueue(true);
  }

  protected selectAsset(assetId: string): void {
    this.selecting.set(true);
    this.selectError.set(null);
    this.selected.set(null);
    this.reviewError.set(null);
    this.reason = '';

    this._assetService.getById(assetId).subscribe({
      next: (asset) => {
        this.selected.set(asset);
        this.selecting.set(false);
      },
      error: (error: iClassifiedHttpError) => {
        this.selectError.set(error);
        this.selecting.set(false);
      },
    });
  }

  protected onReview(approve: boolean): void {
    const asset = this.selected();
    if (!asset) {
      return;
    }

    this.reviewing.set(true);
    this.reviewError.set(null);

    this._assetService
      .adminReview(asset.id, { approve, reason: this.reason.trim() || undefined })
      .subscribe({
        next: () => {
          this.reviewing.set(false);
          this.selected.set(null);
          this.queue.update((current) => current.filter((item) => item.id !== asset.id));
        },
        error: (error: iClassifiedHttpError) => {
          this.reviewing.set(false);
          this.reviewError.set(error);
        },
      });
  }

  private _loadQueue(append: boolean): void {
    if (append) {
      this.loadingMore.set(true);
    } else {
      this.loading.set(true);
      this.queue.set([]);
      this.nextPageToken.set(null);
    }
    this.queueError.set(null);

    this._assetService
      .adminSearch({
        pageSize: PAGE_SIZE,
        status: AssetStatus.PendingModeration,
        nextPageToken: append ? (this.nextPageToken() ?? undefined) : undefined,
      })
      .subscribe({
        next: (response) => {
          this.queue.update((current) => (append ? [...current, ...response.items] : response.items));
          this.nextPageToken.set(response.nextPageToken);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: (error: iClassifiedHttpError) => {
          this.queueError.set(error);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }
}
