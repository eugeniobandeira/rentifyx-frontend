import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@app/environment/environment';
import { CategoryService } from './category.service';
import { iCategoryResponse } from '../interfaces/category-response';

const CATEGORIES_URL = `${environment.assetRegistryApiUrl}/categories`;

const categories: iCategoryResponse[] = [
  { id: 'cat-1', name: 'Heavy Machinery', parentCategoryId: null, depth: 0 },
  { id: 'cat-2', name: 'Excavators', parentCategoryId: 'cat-1', depth: 1 },
];

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() GETs /categories and returns the flat category list', () => {
    service.list().subscribe((response) => expect(response).toEqual(categories));

    const req = httpMock.expectOne(CATEGORIES_URL);
    expect(req.request.method).toBe('GET');
    req.flush(categories);
  });

  it('create() POSTs /categories with the request body', () => {
    const request = { name: 'Excavators', parentCategoryId: 'cat-1' };
    const response = categories[1];

    service.create(request).subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne(CATEGORIES_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(response);
  });

  it('update() PATCHes /categories/{id} with the request body', () => {
    const request = { newName: 'Mini Excavators' };
    const response = { ...categories[1], name: 'Mini Excavators' };

    service.update('cat-2', request).subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne(`${CATEGORIES_URL}/cat-2`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush(response);
  });
});
