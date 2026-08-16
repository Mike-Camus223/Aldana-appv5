import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-creation-sec',
  imports: [ReactiveFormsModule],
  templateUrl: './creation-sec.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: ``
})
export class CreationSecComponent {
  
  productForm: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      sku: ['', Validators.required],
      images: [''],
      sizes: [''],
      colors: ['']
    });
  }
  
  categories = [
    { id: 1, name: 'Vestidos' },
    { id: 2, name: 'Blusas' },
    { id: 3, name: 'Faldas' },
    { id: 4, name: 'Pantalones' },
    { id: 5, name: 'Chaquetas' },
    { id: 6, name: 'Accesorios' }
  ];
  
  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  colors = ['Rojo', 'Azul', 'Negro', 'Blanco', 'Rosa', 'Verde', 'Amarillo'];
  
  onSubmit() {
    if (this.productForm.valid) {
      console.log('Producto creado:', this.productForm.value);
      // Aquí iría la lógica para guardar en Supabase
      alert('Producto creado exitosamente!');
      this.productForm.reset();
    } else {
      console.log('Formulario inválido');
    }
  }
  
  onImageUpload(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Imágenes seleccionadas:', files);
      // Aquí iría la lógica para subir imágenes
    }
  }
}
