import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { AdminCategoriesPage } from './admin-categories';

const categories: iCategoryResponse[] = [
  { id: 'cat-1', name: 'Heavy Machinery', parentCategoryId: null, depth: 0 },
  { id: 'cat-2', name: 'Excavators', parentCategoryId: 'cat-1', depth: 1 },
];

describe('AdminCategoriesPage', () => {
  let categoryService: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  function configure(): AdminCategoriesPage {
    categoryService = {
      list: vi.fn().mockReturnValue(of(categories)),
      create: vi.fn(),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [AdminCategoriesPage],
      providers: [{ provide: CategoryService, useValue: categoryService }],
    });

    const fixture = TestBed.createComponent(AdminCategoriesPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('loads categories on init', () => {
    const component = configure();
    expect(categoryService.list).toHaveBeenCalledTimes(1);
    expect(component['categories']()).toEqual(categories);
  });

  it('onCreateSubmit() does nothing when the name is blank', () => {
    const component = configure();
    component['newName'] = '   ';
    component['onCreateSubmit']();
    expect(categoryService.create).not.toHaveBeenCalled();
  });

  it('onCreateSubmit() creates a category and reloads the list', () => {
    const component = configure();
    component['newName'] = 'Cranes';
    component['newParentCategoryId'] = 'cat-1';
    categoryService.create.mockReturnValue(of({ id: 'cat-3', name: 'Cranes', parentCategoryId: 'cat-1', depth: 1 }));

    component['onCreateSubmit']();

    expect(categoryService.create).toHaveBeenCalledWith({ name: 'Cranes', parentCategoryId: 'cat-1' });
    expect(categoryService.list).toHaveBeenCalledTimes(2);
    expect(component['newName']).toBe('');
  });

  it('onCreateSubmit() error sets createError, does not clear the form', () => {
    const component = configure();
    component['newName'] = 'Cranes';
    const error: iClassifiedHttpError = {
      kind: 'validation',
      status: 422,
      message: 'Max depth exceeded.',
      correlationId: null,
      validationErrors: null,
    };
    categoryService.create.mockReturnValue(throwError(() => error));

    component['onCreateSubmit']();

    expect(component['createError']()).toBe('Max depth exceeded.');
    expect(component['newName']).toBe('Cranes');
  });

  it('startEdit() then saveEdit() updates the category and reloads', () => {
    const component = configure();
    component['startEdit'](categories[1]);
    expect(component['editingId']()).toBe('cat-2');
    expect(component['editName']).toBe('Excavators');

    component['editName'] = 'Mini Excavators';
    categoryService.update.mockReturnValue(of({ ...categories[1], name: 'Mini Excavators' }));

    component['saveEdit']('cat-2');

    expect(categoryService.update).toHaveBeenCalledWith('cat-2', {
      newName: 'Mini Excavators',
      newParentCategoryId: 'cat-1',
    });
    expect(component['editingId']()).toBeNull();
    expect(categoryService.list).toHaveBeenCalledTimes(2);
  });

  it('cancelEdit() clears the editing state without saving', () => {
    const component = configure();
    component['startEdit'](categories[0]);
    component['cancelEdit']();

    expect(component['editingId']()).toBeNull();
    expect(categoryService.update).not.toHaveBeenCalled();
  });
});
