import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AssetService } from '@features/assets/asset/services/asset.service';
import { CategoryService } from '@features/assets/category/services/category.service';
import { iCategoryResponse } from '@features/assets/category/interfaces/category-response';
import { MediaUploadService } from '@features/assets/media/services/media-upload.service';
import { iCreateAssetResponse } from '@features/assets/asset/interfaces/create-asset-response';
import { iAssetModerationResponse } from '@features/assets/asset/interfaces/asset-moderation-response';
import { AssetStatus } from '@features/assets/asset/types/asset-status';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { provideTestTranslate } from '@shared/testing/translate-testing.providers';
import { CreateAssetPage } from './create';

const categories: iCategoryResponse[] = [
  { id: 'cat-1', name: 'Excavators', parentCategoryId: null, depth: 0 },
];

const createResponse: iCreateAssetResponse = {
  assetId: 'asset-1',
  status: AssetStatus.Draft,
  createdAt: '2026-07-27T10:00:00Z',
};

describe('CreateAssetPage', () => {
  let assetService: { create: ReturnType<typeof vi.fn>; submitForModeration: ReturnType<typeof vi.fn> };
  let categoryService: { list: ReturnType<typeof vi.fn> };
  let mediaUploadService: {
    requestUpload: ReturnType<typeof vi.fn>;
    uploadToS3: ReturnType<typeof vi.fn>;
    confirmUpload: ReturnType<typeof vi.fn>;
  };

  function configure(): CreateAssetPage {
    categoryService = { list: vi.fn().mockReturnValue(of(categories)) };
    assetService = { create: vi.fn(), submitForModeration: vi.fn() };
    mediaUploadService = {
      requestUpload: vi.fn(),
      uploadToS3: vi.fn(),
      confirmUpload: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [CreateAssetPage],
      providers: [
        provideRouter([]),
        provideTestTranslate({
          create: { unsupportedMediaFormat: 'Formato não suportado. Use JPEG, PNG, WEBP ou MP4.' },
        }),
        { provide: AssetService, useValue: assetService },
        { provide: CategoryService, useValue: categoryService },
        { provide: MediaUploadService, useValue: mediaUploadService },
      ],
    });

    const fixture = TestBed.createComponent(CreateAssetPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function fillValidForm(component: CreateAssetPage): void {
    component['form'].setValue({
      title: 'Compact Excavator',
      description: 'A well-maintained compact excavator available for rent.',
      price: 285,
      categoryId: 'cat-1',
    });
  }

  it('loads categories on init', () => {
    configure();
    expect(categoryService.list).toHaveBeenCalledTimes(1);
  });

  it('invalid submit does not call the service', () => {
    const component = configure();
    component['onCreateSubmit']();

    expect(assetService.create).not.toHaveBeenCalled();
    expect(component['form'].get('title')?.touched).toBe(true);
  });

  it('valid submit -> create() succeeds -> advances to the media step', () => {
    const component = configure();
    fillValidForm(component);
    assetService.create.mockReturnValue(of(createResponse));

    component['onCreateSubmit']();

    expect(assetService.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Compact Excavator', categoryId: 'cat-1', price: 285 }),
    );
    expect(component['step']()).toBe('media');
    expect(component['assetId']()).toBe('asset-1');
  });

  it('rejects an unsupported file type before calling requestUpload', () => {
    const component = configure();
    fillValidForm(component);
    assetService.create.mockReturnValue(of(createResponse));
    component['onCreateSubmit']();

    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as unknown as Event;
    component['onFileSelected'](event);

    expect(mediaUploadService.requestUpload).not.toHaveBeenCalled();
    expect(component['mediaError']()).toBe('Formato não suportado. Use JPEG, PNG, WEBP ou MP4.');
  });

  it('a valid file uploads end-to-end (requestUpload -> uploadToS3 -> confirmUpload)', () => {
    const component = configure();
    fillValidForm(component);
    assetService.create.mockReturnValue(of(createResponse));
    component['onCreateSubmit']();

    mediaUploadService.requestUpload.mockReturnValue(
      of({ uploadUrl: 'https://s3.example.com/photo.jpg?sig=abc', s3Key: 'assets/asset-1/photo.jpg' }),
    );
    mediaUploadService.uploadToS3.mockReturnValue(of(null));
    mediaUploadService.confirmUpload.mockReturnValue(
      of({ assetId: 'asset-1', s3Key: 'assets/asset-1/photo.jpg' }),
    );

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as unknown as Event;
    component['onFileSelected'](event);

    expect(mediaUploadService.requestUpload).toHaveBeenCalledWith('asset-1', {
      mimeType: 'image/jpeg',
      sizeBytes: file.size,
    });
    expect(mediaUploadService.uploadToS3).toHaveBeenCalledWith(
      'https://s3.example.com/photo.jpg?sig=abc',
      file,
    );
    expect(mediaUploadService.confirmUpload).toHaveBeenCalledWith('asset-1', {
      s3Key: 'assets/asset-1/photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: file.size,
    });
    expect(component['mediaUploaded']()).toBe(true);
    expect(component['mediaUploading']()).toBe(false);
  });

  it('submitForModeration() success -> advances to the done step', () => {
    const component = configure();
    fillValidForm(component);
    assetService.create.mockReturnValue(of(createResponse));
    component['onCreateSubmit']();

    const moderationResponse: iAssetModerationResponse = { assetId: 'asset-1', status: AssetStatus.PendingModeration };
    assetService.submitForModeration.mockReturnValue(of(moderationResponse));

    component['onSubmitForModeration']();

    expect(assetService.submitForModeration).toHaveBeenCalledWith('asset-1');
    expect(component['step']()).toBe('done');
  });

  it('submitForModeration() error -> sets moderationError, stays on the media step', () => {
    const component = configure();
    fillValidForm(component);
    assetService.create.mockReturnValue(of(createResponse));
    component['onCreateSubmit']();

    const error: iClassifiedHttpError = {
      kind: 'server',
      status: 500,
      message: 'Something went wrong.',
      correlationId: null,
      validationErrors: null,
    };
    assetService.submitForModeration.mockReturnValue(throwError(() => error));

    component['onSubmitForModeration']();

    expect(component['step']()).toBe('media');
    expect(component['moderationError']()?.message).toBe('Something went wrong.');
  });
});
