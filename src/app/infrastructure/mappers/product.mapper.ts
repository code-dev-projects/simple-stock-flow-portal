import { Category, Product } from '../../domain/models/product.model';
import { Money } from '../../domain/value-objects/money';
import { CategoryDto, ProductDto } from '../http/dto/api.dto';

export function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    price: Money.of(dto.price, dto.currency),
    stock: dto.stock,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    imageUrl: dto.imageUrl,
  };
}

export function toCategory(dto: CategoryDto): Category {
  return { id: dto.id, name: dto.name };
}
