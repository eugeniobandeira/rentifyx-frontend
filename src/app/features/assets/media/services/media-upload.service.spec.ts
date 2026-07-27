import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@app/environment/environment';
import { MediaUploadService } from './media-upload.service';
import { iRequestMediaUploadResponse } from '../interfaces/request-media-upload-response';
import { iConfirmMediaUploadResponse } from '../interfaces/confirm-media-upload-response';

const ASSETS_URL = `${environment.assetRegistryApiUrl}/assets`;

describe('MediaUploadService', () => {
  let service: MediaUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MediaUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requestUpload() POSTs /assets/{id}/media/upload-request', () => {
    const response: iRequestMediaUploadResponse = {
      uploadUrl: 'https://rentifyx-media.s3.amazonaws.com/assets/asset-1/photo.jpg?sig=abc',
      s3Key: 'assets/asset-1/photo.jpg',
    };

    service
      .requestUpload('asset-1', { mimeType: 'image/jpeg', sizeBytes: 2_097_152 })
      .subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne(`${ASSETS_URL}/asset-1/media/upload-request`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ mimeType: 'image/jpeg', sizeBytes: 2_097_152 });
    req.flush(response);
  });

  it('uploadToS3() PUTs the raw file to the presigned URL with a matching Content-Type', () => {
    const uploadUrl = 'https://rentifyx-media.s3.amazonaws.com/assets/asset-1/photo.jpg?sig=abc';
    const file = new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' });

    service.uploadToS3(uploadUrl, file).subscribe();

    const req = httpMock.expectOne(uploadUrl);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Content-Type')).toBe('image/jpeg');
    expect(req.request.body).toBe(file);
    req.flush(null);
  });

  it('confirmUpload() POSTs /assets/{id}/media/confirm', () => {
    const response: iConfirmMediaUploadResponse = { assetId: 'asset-1', s3Key: 'assets/asset-1/photo.jpg' };

    service
      .confirmUpload('asset-1', { s3Key: 'assets/asset-1/photo.jpg', mimeType: 'image/jpeg', sizeBytes: 2_097_152 })
      .subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne(`${ASSETS_URL}/asset-1/media/confirm`);
    expect(req.request.method).toBe('POST');
    req.flush(response);
  });
});
