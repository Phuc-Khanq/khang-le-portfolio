# Khang Le Portfolio Website

A clean, artistic, and bold personal portfolio website built with HTML, CSS, and vanilla JavaScript.

## 📁 Project Structure

```
portfolio-site/
├── index.html           # Home page
├── about.html          # About page
├── projects.html       # Projects showcase page
├── styles/
│   └── main.css        # All styling (responsive, bold design)
├── scripts/
│   └── main.js         # Interactivity (mobile menu, form validation)
├── assets/             # (Future) Images and media
└── README.md           # This file
```

## 🎨 Design Features

- **Bold, Artistic Aesthetic**: Red (#E63946), Blue (#1D3557), and Black color palette
- **Clean & Minimal**: Lots of whitespace for visual breathing room
- **Fully Responsive**: Mobile-first design that works on all devices
- **Fast & Lightweight**: No frameworks, pure HTML/CSS/JS
- **Modern Typography**: Google Fonts (Poppins, Inter) for clean, readable text

## 📱 Pages

1. **Home (index.html)**: Hero section with introduction and CTA to newsletter
2. **About (about.html)**: Personal story, highlights, and achievements
3. **Projects (projects.html)**: Showcase of songs/creative work (6 project cards)

## ✨ Features

- ✅ Responsive hamburger navigation menu (mobile)
- ✅ Newsletter email signup form (ready for backend integration)
- ✅ Smooth scrolling and animations
- ✅ Form validation (email format checking)
- ✅ Intersection Observer for scroll animations
- ✅ All placeholder content (ready for your real content)

## 🚀 Getting Started

### Prerequisites
- A text editor (VSCode recommended)
- Git (for version control and deployment)
- GitHub account (for free hosting)

### Local Development

1. **Clone or download** this project to your computer
2. **Open `index.html`** in your browser to see the site
3. **Edit content** in the HTML files as needed
4. **Test on mobile** by using browser DevTools (F12 → toggle device toolbar)

## 📧 Newsletter Form

The newsletter form is built with HTML/CSS/JS and currently:
- Validates email format
- Shows success/error messages
- Ready for backend integration

**To connect it later**, you can integrate with:
- **Mailchimp**: Free tier for up to 500 subscribers
- **Substack**: Full-featured newsletter platform
- **ConvertKit**: Creator-focused email platform
- Custom backend: Use your own server/database

For now, the form stores data in the browser (client-side). To make it persistent, you'll need to add a backend service.

## 🌐 Deploy to GitHub Pages (FREE)

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and log in
2. Click **"New"** to create a new repository
3. Name it: `khang-le-portfolio` (or any name)
4. Choose **Public**
5. Click **"Create repository"**

### Step 2: Push Your Code

Open your terminal/command prompt and run:

```bash
# Navigate to your portfolio folder
cd portfolio-site

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial portfolio commit"

# Add remote origin (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/khang-le-portfolio.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select **Deploy from a branch**
5. Select **main** branch, **/(root)** folder
6. Click **Save**

### Step 4: View Your Live Site

- Wait 1-2 minutes for deployment
- Your site will be live at: `https://USERNAME.github.io/khang-le-portfolio/`

Replace `USERNAME` with your GitHub username.

## 📝 Customizing Content

### Update Text
Open the `.html` files and replace placeholder text with your real content:
- Hero heading, subtitle, intro on `index.html`
- Bio and highlights on `about.html`
- Project titles and descriptions on `projects.html`

### Update Colors
Edit the CSS variables in `styles/main.css`:
```css
:root {
  --color-primary-red: #E63946;      /* Change red */
  --color-secondary-blue: #1D3557;   /* Change blue */
  --color-black: #000000;             /* Change black */
}
```

### Update Fonts
In `styles/main.css`, modify:
```css
--font-header: 'Poppins', 'Montserrat', sans-serif;
--font-body: 'Inter', 'Manrope', sans-serif;
```

Or change the Google Fonts link in each HTML file `<head>`.

### Add Images
Place image files in the `assets/` folder, then reference them:
```html
<img src="assets/my-image.jpg" alt="Description">
```

## 🔧 Connecting the Newsletter Later

When you're ready to connect your newsletter service:

### Mailchimp Example
1. Create a Mailchimp account (free)
2. Get your form action URL
3. Replace the `<form>` in each page with Mailchimp's embed code

### Custom Backend
If you want a custom solution, you'll need:
- A backend server (Node.js, Python, etc.)
- A database to store emails
- Update form `action` and `method` attributes

The form HTML is already set up for POST requests—just update the backend.

## 📂 File Guide

| File | Purpose |
|------|---------|
| `index.html` | Home page with hero section |
| `about.html` | About & story page |
| `projects.html` | Projects showcase (6 cards) |
| `styles/main.css` | All CSS (mobile-responsive, bold design) |
| `scripts/main.js` | JavaScript (menu, form, animations) |

## 🎯 Next Steps

1. ✅ Customize content (replace placeholders)
2. ✅ Add your images to `assets/` folder
3. ✅ Test on mobile devices
4. ✅ Deploy to GitHub Pages
5. ✅ Connect newsletter service
6. ✅ Share with the world!

## 📱 Browser Support

- ✅ Chrome, Firefox, Safari, Edge (latest versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ No IE support (legacy browser)

## 🐛 Troubleshooting

**Site looks broken on GitHub Pages?**
- Make sure file names are lowercase
- Check that CSS/JS paths are correct (use relative paths)
- Clear browser cache (Ctrl+Shift+Delete)

**Newsletter form not showing?**
- Check browser console for JavaScript errors (F12)
- Ensure `main.js` is loading correctly
- Verify email input has `type="email"`

**Navigation menu not working on mobile?**
- Check that `main.js` is loaded in your HTML
- Inspect element to see if hamburger class is toggling

## 📄 License

This portfolio is yours to use and modify freely. No license required.

## 💬 Questions?

If you need help:
1. Check the code comments for explanations
2. Review CSS comments for styling details
3. Test locally before deploying changes
4. Use browser DevTools (F12) to debug

---

**Created with ❤️ using clean HTML, CSS, and JavaScript**
