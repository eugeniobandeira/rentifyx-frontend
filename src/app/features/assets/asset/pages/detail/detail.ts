import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AssetService } from '@features/assets/asset/services/asset.service';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iGetAssetByIdResponse } from '@features/assets/asset/interfaces/get-asset-by-id-response';
import { getAssetStatusLabel } from '@features/assets/asset/constants/asset-status-label.map';
import { getCategorySlot } from '@shared/constants/category-color.map';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail.html',
})
export class AssetDetailPage {
  private readonly _route = inject(ActivatedRoute);
  private readonly _assetService = inject(AssetService);
  private readonly _categoryService = inject(CategoryService);

  protected readonly asset = signal<iGetAssetByIdResponse | null>(null);
  protected readonly categoryName = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<iClassifiedHttpError | null>(null);

  protected readonly getAssetStatusLabel = getAssetStatusLabel;

  constructor() {
    const id = this._route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }

    this._assetService.getById(id).subscribe({
      next: (asset) => {
        this.asset.set(asset);
        this.loading.set(false);
        this._loadCategoryName(asset.categoryId);
      },
      error: (classified: iClassifiedHttpError) => {
        this.error.set(classified);
        this.loading.set(false);
      },
    });
  }

  protected badgeStyle(): Record<string, string> {
    const slot = getCategorySlot(this.categoryName() ?? '');
    return {
      'background-color': `var(--color-${slot.bgToken})`,
      color: `var(--color-${slot.textToken})`,
    };
  }

  private _loadCategoryName(categoryId: string): void {
    this._categoryService.list().subscribe({
      next: (categories) => {
        this.categoryName.set(categories.find((c) => c.id === categoryId)?.name ?? categoryId);
      },
      error: () => this.categoryName.set(categoryId),
    });
  }
}
