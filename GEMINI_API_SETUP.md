# Gemini AI API Setup Guide

## 🔑 Setting up Gemini API Key

### Step 1: Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Configure Environment Variable
Add your API key to your `.env.local` file:

```bash
# Add this line to your .env.local file
GEMINI_API_KEY=your_actual_api_key_here
```

### Step 3: Verify Setup
1. Restart your development server
2. Try the employee AI analysis feature
3. Check console logs for any errors

## 🔧 Troubleshooting

### Common Issues:

1. **"API key not valid" error**
   - Double-check your API key is correct
   - Ensure no extra spaces in the .env.local file
   - Make sure the API key has proper permissions

2. **"AI analysis service is currently unavailable"**
   - Check if GEMINI_API_KEY is set in environment variables
   - Restart your development server after adding the key

3. **Quota exceeded errors**
   - Check your Google Cloud billing and quota limits
   - Wait for quota reset (usually daily)

### Environment Variable Locations:
- **Development**: `.env.local`
- **Production**: Set GEMINI_API_KEY in your deployment platform

## 📝 Notes
- The API key should start with "AI..." 
- Keep your API key secret and never commit it to version control
- The optimized prompt limits responses to ~300 words for better readability
