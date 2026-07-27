import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { AssetService } from '@features/assets/asset/services/asset.service';
import { iSearchAssetsResponse } from '@features/assets/asset/interfaces/search-assets-response';
import { AssetStatus } from '@features/assets/asset/types/asset-status';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { BrowseAssetsPage } from './browse';

const categories: iCategoryResponse[] = [
  { id: 'cat-1', name: 'Excavators', parentCategoryId: null, depth: 0 },
];

const firstPage: iSearchAssetsResponse = {
  items: [{ id: 'asset-1', title: 'Compact Excavator', price: 285, categoryId: 'cat-1', status: AssetStatus.Active }],
  nextPageToken: 'page-2',
};

const secondPage: iSearchAssetsResponse = {
  items: [{ id: 'asset-2', title: 'Mini Excavator', price: 210, categoryId: 'cat-1', status: AssetStatus.Active }],
  nextPageToken: null,
};

describe('BrowseAssetsPage', () => {
  let fixture: ComponentFixture<BrowseAssetsPage>;
  let component: BrowseAssetsPage;
  let categoryService: { list: ReturnType<typeof vi.fn> };
  let assetService: { search: ReturnType<typeof vi.fn> };

  function setup(searchResult = firstPage) {
    categoryService = { list: vi.fn().mockReturnValue(of(categories)) };
    assetService = { search: vi.fn().mockReturnValue(of(searchResult)) };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: { isAuthenticated: () => false } },
        { provide: CategoryService, useValue: categoryService },
        { provide: AssetService, useValue: assetService },
      ],
    });

    fixture = TestBed.createComponent(BrowseAssetsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads categories and the first page of assets on init', () => {
    setup();

    expect(categoryService.list).toHaveBeenCalledTimes(1);
    expect(assetService.search).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 12, nextPageToken: undefined }),
    );
    expect(component['items']()).toEqual(firstPage.items);
    expect(component['loading']()).toBe(false);
  });

  it('onSearchSubmit() resets pagination and re-searches with the current filters', () => {
    setup();
    assetService.search.mockReturnValue(of(secondPage));

    component['categoryId'] = 'cat-1';
    component['keyword'] = 'excavator';
    component['onSearchSubmit']();

    expect(assetService.search).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: 'cat-1', keyword: 'excavator', nextPageToken: undefined }),
    );
    expect(component['items']()).toEqual(secondPage.items);
  });

  it('onLoadMore() appends the next page using the stored nextPageToken', () => {
    setup();
    assetService.search.mockReturnValue(of(secondPage));

    component['onLoadMore']();

    expect(assetService.search).toHaveBeenLastCalledWith(
      expect.objectContaining({ nextPageToken: 'page-2' }),
    );
    expect(component['items']()).toEqual([...firstPage.items, ...secondPage.items]);
    expect(component['nextPageToken']()).toBeNull();
  });

  it('on search error, sets the error signal and stops loading', () => {
    categoryService = { list: vi.fn().mockReturnValue(of(categories)) };
    assetService = {
      search: vi.fn().mockReturnValue(
        throwError(() => ({ kind: 'server', status: 500, message: 'Something went wrong.', correlationId: null, validationErrors: null })),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: { isAuthenticated: () => false } },
        { provide: CategoryService, useValue: categoryService },
        { provide: AssetService, useValue: assetService },
      ],
    });

    fixture = TestBed.createComponent(BrowseAssetsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['error']()?.message).toBe('Something went wrong.');
    expect(component['loading']()).toBe(false);
  });
});
