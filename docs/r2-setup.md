# Configuración de Cloudflare R2 para Factufly Pro

## Descripción General

Este documento describe la configuración completa de Cloudflare R2 para el almacenamiento de imágenes en Factufly Pro. La integración incluye subida directa, URLs presignadas, organización de archivos por empresa, y manejo de permisos.

## Arquitectura de Almacenamiento

### Estructura de Directorios

```
bucket-name/
├── {organization-slug}/
│   ├── products/
│   │   ├── {date}/
│   │   │   └── {uuid}-{filename}
│   │   └── {product-id}/
│   │       ├── {date}/
│   │       └── {uuid}-{filename}
│   ├── combos/
│   │   ├── {date}/
│   │   └── {combo-id}/
│   ├── packagings/
│   ├── organization/
│   └── users/
```

### Ejemplo de Estructura Real

```
factufly-storage/
├── acme-corp/
│   ├── products/
│   │   ├── 2024-01-15/
│   │   │   ├── abc123-pizza-margherita.jpg
│   │   │   └── def456-pasta-carbonara.webp
│   │   └── prod_xyz789/
│   │       └── 2024-01-15/
│   │           └── ghi012-producto-especifico.png
│   └── combos/
│       └── 2024-01-15/
│           └── jkl345-combo-familiar.jpg
└── restaurant-bella/
    ├── products/
    └── combos/
```

## Configuración de Cloudflare R2

### 1. Crear Bucket en Cloudflare

1. Accede a tu dashboard de Cloudflare
2. Ve a **R2 Object Storage**
3. Crea un nuevo bucket: `factufly-storage` (o el nombre que prefieras)
4. Configura las políticas de acceso público si es necesario

### 2. Generar API Tokens

1. Ve a **R2 > Manage R2 API tokens**
2. Crea un nuevo token con permisos:
   - **Object Read & Write** para tu bucket
   - **Bucket List** (opcional, para administración)

### 3. Configurar Dominio Personalizado (Opcional pero Recomendado)

```bash
# Ejemplo de configuración de dominio personalizado
Domain: images.factufly.com
Bucket: factufly-storage
```

## Variables de Entorno

### Configuración Requerida

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=factufly-storage

# Opcional: Configuración avanzada
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://images.factufly.com  # Si usas dominio personalizado
```

### Obtener Account ID

```bash
# El Account ID se encuentra en el dashboard de Cloudflare
# URL: https://dash.cloudflare.com/
# Aparece en la barra lateral derecha
```

### Configuración de Desarrollo vs Producción

```env
# Desarrollo
R2_BUCKET=factufly-dev
R2_PUBLIC_URL=https://dev-images.factufly.com

# Staging
R2_BUCKET=factufly-staging
R2_PUBLIC_URL=https://staging-images.factufly.com

# Producción
R2_BUCKET=factufly-prod
R2_PUBLIC_URL=https://images.factufly.com
```

## Implementación Técnica

### 1. Características Implementadas

#### ✅ Subida Directa al Servidor
- Endpoint: `POST /api/upload/images`
- Validación de tipos de archivo
- Limitación de tamaño (10MB por defecto)
- Metadata automático con información de organización

#### ✅ URLs Presignadas para Subida Directa
- Endpoint: `POST /api/upload/presigned`
- Subida directa desde el navegador
- Tiempo de expiración configurable
- Mayor eficiencia para archivos grandes

#### ✅ Eliminación de Archivos
- Endpoint: `DELETE /api/upload/delete`
- Eliminación individual y por lotes
- Verificación de permisos por organización

#### ✅ Organización Multi-tenant
- Aislamiento completo por organización
- Estructura de carpetas jerárquica
- Nomenclatura consistente con UUIDs

### 2. Validaciones de Seguridad

```typescript
// Tipos de archivo permitidos
const allowedMimeTypes = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

// Tamaño máximo por archivo
const maxFileSize = 10 * 1024 * 1024; // 10MB

// Verificación de permisos de organización
const hasAccess = await verifyOrganizationAccess(organizationId, userId);
```

### 3. Estructura de Respuestas API

#### Subida Exitosa
```json
{
  "success": true,
  "data": {
    "key": "acme-corp/products/2024-01-15/abc123-pizza.jpg",
    "url": "https://images.factufly.com/acme-corp/products/2024-01-15/abc123-pizza.jpg",
    "publicUrl": "https://images.factufly.com/acme-corp/products/2024-01-15/abc123-pizza.jpg",
    "size": 1048576,
    "contentType": "image/jpeg",
    "organizationSlug": "acme-corp",
    "entityType": "product"
  },
  "message": "File uploaded successfully"
}
```

#### Error de Validación
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File size (15MB) exceeds maximum allowed size (10MB)"
  }
}
```

## Uso en Componentes Frontend

### 1. ImageUploader Component

```tsx
import { ImageUploader } from "@/components/ui/image-uploader";

<ImageUploader
  organizationId="org_123"
  entityType="product"
  entityId="prod_456"
  maxFiles={5}
  maxSize={10}
  value={imageUrls}
  onChange={setImageUrls}
  onUploadComplete={(urls) => console.log("Uploaded:", urls)}
  onError={(error) => console.error("Upload error:", error)}
/>
```

### 2. Hook personalizado

```tsx
import { useImageUpload } from "@/hooks/use-image-upload";

const { uploadDirect, isUploading, deleteImages } = useImageUpload({
  organizationId: "org_123",
  entityType: "product",
  maxFiles: 5,
  maxSizeBytes: 10 * 1024 * 1024,
});

// Subir archivos
const handleUpload = async (files: File[]) => {
  const results = await uploadDirect(files);
  console.log("Upload results:", results);
};

// Eliminar imágenes
const handleDelete = async (urls: string[]) => {
  const result = await deleteImages(urls);
  console.log("Delete result:", result);
};
```

## Optimizaciones de Performance

### 1. CDN y Caching

```typescript
// Headers de cache para imágenes
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000', // 1 año
  'ETag': generateETag(),
  'Last-Modified': uploadDate.toUTCString()
};
```

### 2. Formatos de Imagen Optimizados

```typescript
// Configuración de formatos soportados (en orden de preferencia)
const preferredFormats = [
  'image/webp',    // Mejor compresión
  'image/jpeg',    // Compatibilidad universal
  'image/png'      // Para imágenes con transparencia
];
```

### 3. Compresión Automática (Futuro)

```typescript
// Ejemplo de configuración para compresión automática
const compressionSettings = {
  webp: { quality: 85, method: 6 },
  jpeg: { quality: 85, progressive: true },
  png: { compressionLevel: 9 }
};
```

## Monitoreo y Análisis

### 1. Métricas a Trackear

- **Uso de almacenamiento por organización**
- **Número de subidas por día/mes**
- **Tiempo promedio de subida**
- **Errores de subida y sus causas**
- **Uso de ancho de banda**

### 2. Alertas Recomendadas

```typescript
// Configuración de alertas
const alerts = {
  storageLimit: '80%', // Alerta al 80% del límite
  errorRate: '5%',     // Alerta si >5% de subidas fallan
  largFiles: '50MB',   // Alerta para archivos muy grandes
};
```

## Costos y Límites

### Cloudflare R2 Pricing (2024)

- **Storage**: $0.015/GB/mes
- **Class A Operations** (write, list): $4.50/millón
- **Class B Operations** (read): $0.36/millón
- **Egress**: Gratis hasta 10TB/mes

### Configuración de Límites

```typescript
// Límites recomendados por organización
const organizationLimits = {
  maxStorageGB: 100,        // 100GB por organización
  maxFilesPerUpload: 10,    // 10 archivos por subida
  maxFileSize: 10 * 1024 * 1024, // 10MB por archivo
  maxDailyUploads: 1000,    // 1000 subidas por día
};
```

## Seguridad y Backup

### 1. Políticas de Acceso

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::factufly-storage/*",
      "Condition": {
        "StringLike": {
          "s3:prefix": "${organization-slug}/*"
        }
      }
    }
  ]
}
```

### 2. Backup Strategy

- **Backup automático**: Configurar replicación entre regiones
- **Versionado**: Habilitar versionado de objetos para recovery
- **Lifecycle policies**: Configurar eliminación automática de versiones antiguas

## Troubleshooting

### Problemas Comunes

1. **Error 403 Forbidden**
   - Verificar API tokens y permisos
   - Confirmar que el bucket existe
   - Revisar políticas de CORS

2. **Subidas Lentas**
   - Verificar tamaño de archivos
   - Considerar usar URLs presignadas
   - Revisar conexión de red

3. **URLs de Imágenes No Funcionan**
   - Verificar configuración de dominio público
   - Confirmar políticas de acceso público
   - Revisar configuración de CORS

### Comandos de Diagnóstico

```bash
# Verificar conectividad
curl -I https://your-account.r2.cloudflarestorage.com

# Listar objetos en bucket
aws s3 ls s3://factufly-storage --endpoint-url=https://your-account.r2.cloudflarestorage.com

# Subir archivo de prueba
aws s3 cp test.jpg s3://factufly-storage/test/ --endpoint-url=https://your-account.r2.cloudflarestorage.com
```

## Roadmap de Funcionalidades

### Próximas Implementaciones

1. **✅ Subida y eliminación básica** (Completado)
2. **🔄 Compresión automática de imágenes** (En progreso)
3. **📋 Panel de administración de storage** (Planeado)
4. **📊 Analytics y métricas detalladas** (Planeado)
5. **🔄 Sincronización con CDN** (Planeado)
6. **🖼️ Generación automática de thumbnails** (Futuro)
7. **🏷️ Etiquetado automático con AI** (Futuro)

### Integraciones Futuras

- **Image optimization service**
- **AI-powered image tagging**
- **Advanced search by image content**
- **Automatic backup to multiple providers**
