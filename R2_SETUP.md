# Cloudflare R2 Setup Guide

This project uses Cloudflare R2 for storing `.cok` save files and images. Follow these steps to set up R2:

## 1. Create Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Name your bucket (e.g., `cs2-saves`)
5. Choose **Standard** storage class

## 2. Create API Token

1. In Cloudflare Dashboard, go to **My Profile** > **API Tokens**
2. Click **Create Token**
3. Use **Custom token** template
4. Set permissions:
   - **Account** > **Object Storage** > **Edit**
5. Set **Account Resources** to your account
6. Create the token and save the credentials

## 3. Get Public URL

1. In your R2 bucket page, go to **Settings**
2. Find **Public Development URL** section  
3. Copy the URL (e.g., `https://pub-ba1c78e7f54646c4bd11875db43f3c72.r2.dev`)
4. This is your `R2_PUBLIC_URL`

## 4. Environment Variables

Add these to your `.env.local` file:

```env
# Cloudflare R2 Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://pub-ba1c78e7f54646c4bd11875db43f3c72.r2.dev
```

## 5. Vercel Environment Variables

For production deployment, add the same environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each R2 variable

## 6. File Structure

Files will be stored in R2 with this structure:
- `.cok` files: `saves/{userId}/{timestamp}-{randomId}.cok`
- Images: `images/{size}/{userId}/{timestamp}-{randomId}-{filename}.webp`

## 7. Benefits

- **Cost**: ~$15/month for 1TB storage (vs $108/month with AWS S3)
- **Performance**: Global CDN with no egress fees
- **Scalability**: Unlimited storage and bandwidth
- **Reliability**: 99.999999999% durability

## 8. Migration

Existing files in `uploads/` and `public/uploads/` should be moved to R2. The system will automatically use R2 for new uploads. 