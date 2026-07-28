import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { AssetService } from '@features/assets/asset/services/asset.service';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { MediaUploadService } from '@features/assets/media/services/media-upload.service';
import { ALLOWED_MEDIA_MIME_TYPES } from '@features/assets/media/constants/media-rules.constants';
import { FORM_FIELD_NAMES } from './create.constants';
import { createCreateAssetFormControl, CreateAssetFormGroup } from '@features/assets/asset/constants/create-asset-form.config';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { useFormSubmission } from '@shared/composables/use-form-submission';

type Step = 'form' | 'media' | 'moderation' | 'done';

@Component({
  selector: 'app-create-asset',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create.html',
})
export class CreateAssetPage {
  private readonly _assetService = inject(AssetService);
  private readonly _categoryService = inject(CategoryService);
  private readonly _mediaUploadService = inject(MediaUploadService);
  private readonly _translate = inject(TranslateService);

  protected readonly categories = signal<iCategoryResponse[]>([]);
  protected readonly step = signal<Step>('form');
  protected readonly assetId = signal<string | null>(null);

  protected readonly mediaUploading = signal(false);
  protected readonly mediaError = signal<string | null>(null);
  protected readonly mediaUploaded = signal(false);

  protected readonly submittingModeration = signal(false);
  protected readonly moderationError = signal<iClassifiedHttpError | null>(null);

  protected readonly form: CreateAssetFormGroup = createCreateAssetFormControl();

  private readonly _formSubmission = useFormSubmission();
  protected readonly banner = this._formSubmission.banner;
  protected readonly submitting = this._formSubmission.submitting;

  private readonly _idempotencyKey = crypto.randomUUID();

  constructor() {
    this._categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
  }

  protected isInvalid(controlName: (typeof FORM_FIELD_NAMES)[number]): boolean {
    return this._formSubmission.isInvalid(this.form.get(controlName));
  }

  protected fieldErrorMessage(controlName: (typeof FORM_FIELD_NAMES)[number]): string {
    return this._formSubmission.fieldErrorMessage(this.form.get(controlName));
  }

  protected onCreateSubmit(): void {
    this._formSubmission.reset();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this._formSubmission.setSubmitting(true);
    const value = this.form.getRawValue();

    this._assetService
      .create({
        title: value.title,
        description: value.description,
        price: value.price ?? 0,
        categoryId: value.categoryId,
        idempotencyKey: this._idempotencyKey,
      })
      .subscribe({
        next: (response) => {
          this._formSubmission.setSubmitting(false);
          this.assetId.set(response.assetId);
          this.step.set('media');
        },
        error: (error: iClassifiedHttpError) => {
          this._formSubmission.setSubmitting(false);
          this._formSubmission.handleError(error, this.form, FORM_FIELD_NAMES);
        },
      });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const assetId = this.assetId();
    if (!file || !assetId) {
      return;
    }

    this.mediaError.set(null);

    if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type)) {
      this.mediaError.set(this._translate.instant('create.unsupportedMediaFormat'));
      return;
    }

    this.mediaUploading.set(true);

    this._mediaUploadService
      .requestUpload(assetId, { mimeType: file.type, sizeBytes: file.size })
      .pipe(
        switchMap((uploadRequest) =>
          this._mediaUploadService.uploadToS3(uploadRequest.uploadUrl, file).pipe(
            switchMap(() =>
              this._mediaUploadService.confirmUpload(assetId, {
                s3Key: uploadRequest.s3Key,
                mimeType: file.type,
                sizeBytes: file.size,
              }),
            ),
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.mediaUploading.set(false);
          this.mediaUploaded.set(true);
        },
        error: (error: iClassifiedHttpError) => {
          this.mediaUploading.set(false);
          this.mediaError.set(error.message);
        },
      });
  }

  protected onSubmitForModeration(): void {
    const assetId = this.assetId();
    if (!assetId) {
      return;
    }

    this.submittingModeration.set(true);
    this.moderationError.set(null);

    this._assetService.submitForModeration(assetId).subscribe({
      next: () => {
        this.submittingModeration.set(false);
        this.step.set('done');
      },
      error: (error: iClassifiedHttpError) => {
        this.submittingModeration.set(false);
        this.moderationError.set(error);
      },
    });
  }
}
