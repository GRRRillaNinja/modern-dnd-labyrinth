# Deployment Checklist - Delve & Dash

## Things to Review/Change Before Going to Production

### 1. Environment Variables & Supabase Configuration
- [ ] Check `.env` or environment variable files for Supabase keys
- [ ] Ensure you're using the **production** Supabase URL and anon key (not test/dev keys)
- [ ] Verify RLS (Row Level Security) policies are properly configured in Supabase
- [ ] Review any API keys or secrets to ensure they're environment variables, not hardcoded

### 2. Build & Deployment Settings
- [ ] Review `vite.config.ts` - remove `open: true` for production
- [ ] Check `package.json` scripts - ensure build command is correct
- [ ] Verify output directory (`dist`) is configured correctly

### 3. URLs & Paths
- [ ] Search codebase for any `localhost` references
- [ ] Check for hardcoded URLs that need to be replaced with your production domain
- [ ] Update any redirect URIs in Supabase Auth settings to match your new domain

### 4. SEO & Meta Tags
- [ ] Update `index.html` with proper:
  - [ ] Page title
  - [ ] Meta description
  - [ ] Favicon
  - [ ] Open Graph tags (og:image, og:title, og:description for social sharing)
  - [ ] Twitter card meta tags

### 5. Security
- [ ] Review CORS settings if applicable
- [ ] Check CSP (Content Security Policy) headers
- [ ] Ensure no sensitive data is logged to console in production
- [ ] Verify all Supabase RLS policies are locked down

### 6. Performance
- [ ] Verify code splitting is working
- [ ] Check bundle sizes (you already have chunk size warnings - might want to address those)
- [ ] Consider adding lazy loading for leaderboard/modals
- [ ] Optimize images if any

### 7. Analytics & Monitoring (Optional)
- [ ] Consider adding Google Analytics or similar
- [ ] Error tracking (Sentry, LogRocket, etc.)

### 8. Legal/Content
- [ ] Add privacy policy if collecting any user data
- [ ] Terms of service
- [ ] Credits/attribution page
- [ ] Update any placeholder text

### 9. Testing Checklist
- [ ] Test on multiple browsers
- [ ] Test all mobile orientations (you've done a lot of this!)
- [ ] Test game functionality end-to-end
- [ ] Test leaderboard submission
- [ ] Verify all audio works

### 10. Domain-Specific
- [ ] Update package.json name/description if desired
- [ ] Consider adding a custom 404 page
- [ ] Set up redirects (HTTP → HTTPS, www vs non-www)

---

## Most Critical Items:
1. ✅ Supabase production keys & RLS policies
2. ✅ Remove localhost URLs
3. ✅ SEO meta tags
4. ✅ Test everything on the production build (`npm run build` then serve the `dist` folder)

---

## Next Steps:
1. Work through this checklist item by item
2. Build the project: `npm run build`
3. Test the production build locally
4. Deploy to your hosting provider
5. Test on the live domain
6. Monitor for any issues

Good luck with the deployment! 🚀
