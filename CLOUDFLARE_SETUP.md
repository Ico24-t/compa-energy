# Cloudflare Pages Configuration

## Build Settings

**Framework preset:** Create React App

**Build command:**
```
npm run build
```

**Build output directory:**
```
build
```

**Root directory:**
```
/
```

## Environment Variables

Add these in Cloudflare Pages Settings → Environment variables:

### Production
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_CLIENT=your_client_template_id
REACT_APP_EMAILJS_TEMPLATE_OPERATOR=your_operator_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### Preview (Optional - same as production for testing)
Same values as Production

## Deployment Steps

1. Push your code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Click "Create a project"
4. Connect to Git
5. Select your repository
6. Configure build settings (see above)
7. Add environment variables
8. Click "Save and Deploy"

## Custom Domain (Optional)

1. Go to your Cloudflare Pages project
2. Click "Custom domains"
3. Add your domain
4. Follow DNS instructions

## Notes

- Builds are automatic on every push to main branch
- Preview deployments are created for pull requests
- Build time: ~2-3 minutes
- Static site, no server-side code needed
