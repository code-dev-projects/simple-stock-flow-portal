import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoryDto, ProductDto } from '../../../../infrastructure/http/dto/api.dto';
import { infrastructureProviders } from '../../../../infrastructure/providers';
import { ProductFormPage } from './product-form.page';

describe('ProductFormPage', () => {
  let fixture: ComponentFixture<ProductFormPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFormPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...infrastructureProviders,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProductFormPage);
  });

  afterEach(() => httpMock.verify());

  it('fills the category selector with what the backend served, in that order (D-C1)', async () => {
    fixture.detectChanges();

    const categories: CategoryDto[] = [
      { id: '33333333-3333-4333-8333-333333333333', name: 'Electricidad' },
      { id: '44444444-4444-4444-8444-444444444444', name: 'Fontanería' },
    ];
    httpMock.expectOne('/api/categories').flush(categories);

    await fixture.whenStable();
    fixture.detectChanges();

    const options: NodeListOf<HTMLOptionElement> =
      fixture.nativeElement.querySelectorAll('select option:not([value=""])');
    expect(Array.from(options).map((option) => option.textContent?.trim())).toEqual([
      'Electricidad',
      'Fontanería',
    ]);
  });

  it('leaves the category unanswered instead of implying the first one was chosen', async () => {
    fixture.detectChanges();

    httpMock
      .expectOne('/api/categories')
      .flush([{ id: '33333333-3333-4333-8333-333333333333', name: 'Electricidad' }] as CategoryDto[]);

    await fixture.whenStable();
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('');
    expect(select.options[0].textContent?.trim()).toBe('Selecciona una categoría');
  });

  it('says beside the selector that the category list is closed in this version (D-10)', async () => {
    fixture.detectChanges();

    httpMock
      .expectOne('/api/categories')
      .flush([{ id: '33333333-3333-4333-8333-333333333333', name: 'Electricidad' }] as CategoryDto[]);

    await fixture.whenStable();
    fixture.detectChanges();

    const field = (fixture.nativeElement as HTMLElement).querySelector('select')?.closest('.field');
    const hint = field?.querySelector('.field__hint');

    expect(hint).withContext('the category field carries no hint at all').not.toBeNull();
    expect(hint?.textContent).toContain('fijas');
  });

  it('names the picked file in Spanish instead of leaving the browser to say it', async () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/categories').flush([] as CategoryDto[]);

    await fixture.whenStable();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array([1])], 'taladro.png', { type: 'image/png' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('taladro.png');
    expect(fixture.nativeElement.textContent).not.toContain('Choose File');
  });

  it('tells the person when the categories could not be loaded', async () => {
    fixture.detectChanges();

    httpMock
      .expectOne('/api/categories')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar',
    );
  });

  it('shows the picture the product already has when it is edited (CA-03.1)', async () => {
    const id = '55555555-5555-4555-8555-555555555555';
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();

    httpMock
      .expectOne('/api/categories')
      .flush([{ id: '33333333-3333-4333-8333-333333333333', name: 'Electricidad' }] as CategoryDto[]);
    await fixture.whenStable();

    const product: ProductDto = {
      id,
      name: 'Taladro',
      price: 120000,
      currency: 'COP',
      stock: 12,
      categoryId: '33333333-3333-4333-8333-333333333333',
      categoryName: 'Electricidad',
      imageUrl: '/media/9f2ca1.jpg',
    };
    httpMock.expectOne(`/api/products/${id}`).flush(product);

    // whenStable resolves one microtask deep; the repository hands the promise on twice before
    // ngOnInit sees the product, so the assertion has to wait past the whole microtask queue.
    await new Promise<void>((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    const image: HTMLImageElement | null = fixture.nativeElement.querySelector('img');
    expect(image?.getAttribute('src')).toBe('/media/9f2ca1.jpg');
    expect(image?.getAttribute('alt')).toContain('Taladro');

    image?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.picture__current--empty')).not.toBeNull();
  });
});
