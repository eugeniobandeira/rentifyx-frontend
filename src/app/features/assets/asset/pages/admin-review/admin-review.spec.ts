import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AssetService } from '@features/assets/asset/services/asset.service';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { iAdminSearchAssetsResponse } from '@features/assets/asset/interfaces/admin-search-assets-response';
import { iGetAssetByIdResponse } from '@features/assets/asset/interfaces/get-asset-by-id-response';
import { iAssetModerationResponse } from '@features/assets/asset/interfaces/asset-moderation-response';
import { AssetStatus } from '@features/assets/asset/types/asset-status';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { provideTestTranslate } from '@shared/testing/translate-testing.providers';
import { AdminReviewAssetPage } from './admin-review';

const categories: iCategoryResponse[] = [
  { id: 'cat-1', name: 'Excavators', parentCategoryId: null, depth: 0 },
];

const firstPage: iAdminSearchAssetsResponse = {
  items: [
    {
      id: 'asset-1',
      title: 'Compact Excavator',
      price: 285,
      categoryId: 'cat-1',
      ownerId: 'owner-1',
      status: AssetStatus.PendingModeration,
      createdAt: '2026-07-20T14:32:00Z',
    },
  ],
  nextPageToken: 'page-2',
};

const assetDetail: iGetAssetByIdResponse = {
  id: 'asset-1',
  title: 'Compact Excavator',
  description: 'A well-maintained compact excavator.',
  price: 285,
  categoryId: 'cat-1',
  ownerId: 'owner-1',
  status: AssetStatus.PendingModeration,
  createdAt: '2026-07-20T14:32:00Z',
};

describe('AdminReviewAssetPage', () => {
  let assetService: {
    adminSearch: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    adminReview: ReturnType<typeof vi.fn>;
  };
  let categoryService: { list: ReturnType<typeof vi.fn> };

  function configure(): AdminReviewAssetPage {
    categoryService = { list: vi.fn().mockReturnValue(of(categories)) };
    assetService = {
      adminSearch: vi.fn().mockReturnValue(of(firstPage)),
      getById: vi.fn(),
      adminReview: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [AdminReviewAssetPage],
      providers: [
        provideTestTranslate(),
        { provide: AssetService, useValue: assetService },
        { provide: CategoryService, useValue: categoryService },
      ],
    });

    const fixture = TestBed.createComponent(AdminReviewAssetPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('loads the PendingModeration queue and categories on init', () => {
    const component = configure();

    expect(assetService.adminSearch).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 12, status: AssetStatus.PendingModeration, nextPageToken: undefined }),
    );
    expect(component['queue']()).toEqual(firstPage.items);
    expect(component['loading']()).toBe(false);
  });

  it('onLoadMore() appends the next page using the stored nextPageToken', () => {
    const component = configure();
    const secondPage: iAdminSearchAssetsResponse = {
      items: [{ ...firstPage.items[0], id: 'asset-2' }],
      nextPageToken: null,
    };
    assetService.adminSearch.mockReturnValue(of(secondPage));

    component['onLoadMore']();

    expect(assetService.adminSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ nextPageToken: 'page-2' }),
    );
    expect(component['queue']()).toEqual([...firstPage.items, ...secondPage.items]);
  });

  it('selectAsset() fetches the full asset detail', () => {
    const component = configure();
    assetService.getById.mockReturnValue(of(assetDetail));

    component['selectAsset']('asset-1');

    expect(assetService.getById).toHaveBeenCalledWith('asset-1');
    expect(component['selected']()).toEqual(assetDetail);
  });

  it('onReview(true) approves and removes the asset from the queue', () => {
    const component = configure();
    assetService.getById.mockReturnValue(of(assetDetail));
    component['selectAsset']('asset-1');

    const response: iAssetModerationResponse = { assetId: 'asset-1', status: AssetStatus.Active };
    assetService.adminReview.mockReturnValue(of(response));

    component['onReview'](true);

    expect(assetService.adminReview).toHaveBeenCalledWith('asset-1', { approve: true, reason: undefined });
    expect(component['selected']()).toBeNull();
    expect(component['queue']()).toEqual([]);
  });

  it('onReview() error sets reviewError, keeps the asset selected', () => {
    const component = configure();
    assetService.getById.mockReturnValue(of(assetDetail));
    component['selectAsset']('asset-1');

    const error: iClassifiedHttpError = {
      kind: 'validation',
      status: 422,
      message: "Asset must be in 'PendingModeration' status.",
      correlationId: null,
      validationErrors: null,
    };
    assetService.adminReview.mockReturnValue(throwError(() => error));

    component['onReview'](true);

    expect(component['reviewError']()?.message).toBe("Asset must be in 'PendingModeration' status.");
    expect(component['selected']()).toEqual(assetDetail);
  });
});
