Android WebView Generator API - Render.com Deployment Guide
====================================================

This guide will help you deploy the Android WebView Generator API on Render.com's free tier.

Prerequisites
------------
1. A GitHub account
2. A Render.com account (sign up at https://render.com)
3. Git installed on your local machine

Step 1: Prepare Your Code
------------------------
1. Make sure you have all the required files:
   - src/index.js
   - Dockerfile
   - render.yaml
   - package.json
   - templates/ (directory with Android template)
   - .gitignore

2. Initialize Git repository and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

Step 2: Deploy on Render.com
---------------------------
1. Go to https://render.com and sign in
2. Click "New +" button and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: android-webview-generator (or your preferred name)
   - Environment: Docker
   - Branch: main
   - Plan: Free
   - Click "Create Web Service"

Step 3: Wait for Deployment
--------------------------
1. Render will automatically start building your application
2. The build process might take 5-10 minutes due to Android SDK installation
3. You can monitor the build progress in the Render dashboard

Step 4: Test Your Deployment
---------------------------
1. Once deployed, Render will provide a URL like: https://your-app-name.onrender.com
2. Test the health check endpoint:
   ```bash
   curl https://your-app-name.onrender.com/
   ```
   Expected response: {"status":"ok"}

3. Test the app generation endpoint:
   ```bash
   curl -X POST https://your-app-name.onrender.com/generate-app \
     -F "appName=MyWebApp" \
     -F "packageName=com.example.mywebapp" \
     -F "version=1.0.0" \
     -F "url=https://example.com" \
     -F "icon=@/path/to/icon.png" \
     -F "htmlFile=@/path/to/webcontent.zip"
   ```

Important Notes
--------------
1. Free Tier Limitations:
   - 512MB RAM
   - Shared CPU
   - Service spins down after 15 minutes of inactivity
   - First request after inactivity will be slow (cold start)
   - Limited bandwidth for file uploads

2. Build Process:
   - APK generation might take longer than on local machine
   - Large file uploads might be slow
   - Temporary files are automatically cleaned up

3. Troubleshooting:
   - Check Render logs in the dashboard for build errors
   - Monitor service status in the Render dashboard
   - If build fails, check Android SDK installation in logs

4. Security:
   - Keep your Render.com dashboard secure
   - Monitor API usage
   - Clean up old builds if needed

Maintenance
----------
1. Regular Updates:
   - Keep dependencies updated
   - Monitor Render.com status page for maintenance
   - Check for Android SDK updates

2. Monitoring:
   - Use Render.com dashboard to monitor service health
   - Check logs for any errors
   - Monitor resource usage

Support
-------
If you encounter issues:
1. Check Render.com documentation
2. Review application logs in Render dashboard
3. Check GitHub issues for known problems
4. Contact Render.com support if needed

Remember: The free tier is suitable for testing and development. For production use, consider upgrading to a paid plan for better performance and reliability. 