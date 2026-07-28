import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AssetService } from '@features/assets/asset/services/asset.service';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iGetAssetByIdResponse } from '@features/assets/asset/interfaces/get-asset-by-id-response';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { AssetStatus } from '@features/assets/asset/types/asset-status';
import { provideTestTranslate } from '@shared/testing/translate-testing.providers';
import { AssetDetailPage } from './detail';

const asset: iGetAssetByIdResponse = {
  id: 'asset-1',
  title: 'Compact Excavator',
  description: 'A well-maintained compact excavator.',
  price: 285,
  categoryId: 'cat-1',
  ownerId: 'owner-1',
  status: AssetStatus.Active,
  createdAt: '2026-07-20T14:32:00Z',
};

const categories: iCategoryResponse[] = [
  { id: 'cat-1', name: 'Excavators', parentCategoryId: null, depth: 0 },
];

describe('AssetDetailPage', () => {
  let assetService: { getById: ReturnType<typeof vi.fn> };
  let categoryService: { list: ReturnType<typeof vi.fn> };

  function configure(id: string | null): ComponentFixture<AssetDetailPage> {
    TestBed.configureTestingModule({
      imports: [AssetDetailPage],
      providers: [
        provideTestTranslate(),
        { provide: AssetService, useValue: assetService },
        { provide: CategoryService, useValue: categoryService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => id } } },
        },
      ],
    });

    return TestBed.createComponent(AssetDetailPage);
  }

  beforeEach(() => {
    categoryService = { list: vi.fn().mockReturnValue(of(categories)) };
  });

  it('loads the asset and resolves its category name on success', () => {
    assetService = { getById: vi.fn().mockReturnValue(of(asset)) };

    const fixture = configure('asset-1');
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(assetService.getById).toHaveBeenCalledWith('asset-1');
    expect(component['asset']()).toEqual(asset);
    expect(component['categoryName']()).toBe('Excavators');
    expect(component['loading']()).toBe(false);
  });

  it('on a 403, sets the error signal instead of the asset', () => {
    assetService = {
      getById: vi.fn().mockReturnValue(
        throwError(() => ({
          kind: 'forbidden',
          status: 403,
          message: "You don't have permission to do that",
          correlationId: null,
          validationErrors: null,
        })),
      ),
    };

    const fixture = configure('asset-1');
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component['asset']()).toBeNull();
    expect(component['error']()?.kind).toBe('forbidden');
    expect(component['loading']()).toBe(false);
  });

  it('with no route id, stops loading without calling the service', () => {
    assetService = { getById: vi.fn() };

    const fixture = configure(null);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(assetService.getById).not.toHaveBeenCalled();
    expect(component['loading']()).toBe(false);
  });
});
