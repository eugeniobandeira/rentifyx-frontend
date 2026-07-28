import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-categories.html',
})
export class AdminCategoriesPage {
  private readonly _categoryService = inject(CategoryService);

  protected readonly categories = signal<iCategoryResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<iClassifiedHttpError | null>(null);

  protected newName = '';
  protected newParentCategoryId = '';
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly editingId = signal<string | null>(null);
  protected editName = '';
  protected editParentCategoryId = '';
  protected readonly savingEdit = signal(false);
  protected readonly editError = signal<string | null>(null);

  constructor() {
    this._loadCategories();
  }

  protected onCreateSubmit(): void {
    if (!this.newName.trim()) {
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    this._categoryService
      .create({
        name: this.newName.trim(),
        parentCategoryId: this.newParentCategoryId || undefined,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.newName = '';
          this.newParentCategoryId = '';
          this._loadCategories();
        },
        error: (error: iClassifiedHttpError) => {
          this.creating.set(false);
          this.createError.set(error.message);
        },
      });
  }

  protected startEdit(category: iCategoryResponse): void {
    this.editingId.set(category.id);
    this.editName = category.name;
    this.editParentCategoryId = category.parentCategoryId ?? '';
    this.editError.set(null);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected saveEdit(id: string): void {
    this.savingEdit.set(true);
    this.editError.set(null);

    this._categoryService
      .update(id, {
        newName: this.editName.trim() || undefined,
        newParentCategoryId: this.editParentCategoryId || undefined,
      })
      .subscribe({
        next: () => {
          this.savingEdit.set(false);
          this.editingId.set(null);
          this._loadCategories();
        },
        error: (error: iClassifiedHttpError) => {
          this.savingEdit.set(false);
          this.editError.set(error.message);
        },
      });
  }

  private _loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    this._categoryService.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error: iClassifiedHttpError) => {
        this.error.set(error);
        this.loading.set(false);
      },
    });
  }
}
