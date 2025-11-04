# Image Optimization Guide

## Recommended Image Sizes

### Tournament Thumbnails
- Width: 640px
- Height: 360px (16:9 aspect ratio)
- Format: WebP (fallback to JPEG)
- Quality: 80%

### User Avatars
- Size: 200x200px
- Format: WebP
- Quality: 85%

### Tournament Banners
- Width: 1920px
- Height: 600px
- Format: WebP
- Quality: 85%

## Next.js Image Component

Always use Next.js `<Image>` component:

```tsx
import Image from 'next/image';

// Tournament thumbnail
<Image
  src="/tournaments/summer-championship.webp"
  alt="Summer Championship tournament"
  width={640}
  height={360}
  priority={false} // true for above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/..." // Optional blur placeholder
/>

// Avatar
<Image
  src={user.avatar_url || '/default-avatar.png'}
  alt={user.full_name || 'User avatar'}
  width={200}
  height={200}
  className="rounded-full"
/>
```

## Lazy Loading Rules

### Above the fold (Hero, first card)
```tsx
<Image ... priority={true} />
```

### Below the fold (List items, modals)
```tsx
<Image ... loading="lazy" />
```

## Supabase Storage

### Upload Optimized Images

```typescript
// In your upload function
import sharp from 'sharp'; // Add to package.json if using

const optimizeImage = async (file: File) => {
  const buffer = await file.arrayBuffer();
  
  // Resize and optimize
  const optimized = await sharp(Buffer.from(buffer))
    .resize(640, 360, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
  
  return optimized;
};

// Upload to Supabase
const { data, error } = await supabase.storage
  .from('tournament-images')
  .upload(`${tournamentId}/thumbnail.webp`, optimizedBuffer);
```

### Serve from CDN

```tsx
const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tournament-images/${tournamentId}/thumbnail.webp`;

<Image
  src={imageUrl}
  alt="Tournament thumbnail"
  width={640}
  height={360}
  loading="lazy"
/>
```

## Performance Tips

1. **Use WebP format** - 25-35% smaller than JPEG
2. **Serve responsive images** - Use `srcSet` for different screen sizes
3. **Lazy load offscreen images** - Reduces initial bundle size
4. **Add blur placeholder** - Improves perceived performance
5. **Set explicit width/height** - Prevents layout shift (CLS)

## Bundle Size Impact

```bash
# Analyze bundle size
npm run build

# Check bundle analyzer (install if needed)
npm install --save-dev @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

# Run
ANALYZE=true npm run build
```

## Lazy Load Heavy Components

```tsx
// Bad - loads immediately
import { FixturesViewer } from '@/components/FixturesViewer';

// Good - lazy loads when needed
import dynamic from 'next/dynamic';

const FixturesViewer = dynamic(
  () => import('@/components/FixturesViewer').then(mod => ({ default: mod.FixturesViewer })),
  {
    loading: () => <Skeleton height={400} />,
    ssr: false, // Disable SSR if needed
  }
);
```

## Monitoring

- **Core Web Vitals**: Check in Chrome DevTools > Performance
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

