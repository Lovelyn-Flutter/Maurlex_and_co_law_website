const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'maurlex-articles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 675, crop: 'limit' }]
  }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'maurlex-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/maurlex', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected Successfully');
}).catch(err => {
  console.error('MongoDB Connection Error:', err);
});

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, default: '/images/placeholder-article.jpg' },
  category: { type: String, default: 'General' },
  author: { type: String, default: 'Maurlex Team' },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Article = mongoose.model('Article', articleSchema);

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'active' },
  brevoId: { type: Number }
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  message: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'new' },
  brevoSent: { type: Boolean, default: false }
});

const Contact = mongoose.model('Contact', contactSchema);

async function addToBrevoList(email, name = '') {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/contacts',
      {
        email: email,
        attributes: {
          FIRSTNAME: name.split(' ')[0] || '',
          LASTNAME: name.split(' ').slice(1).join(' ') || ''
        },
        listIds: [parseInt(process.env.BREVO_LIST_ID)],
        updateEnabled: true
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Brevo API Error:', error.response?.data || error.message);
    throw error;
  }
}

async function sendBrevoEmail(to, subject, htmlContent) {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Maurlex & Co.',
          email: process.env.BREVO_SENDER_EMAIL || 'maurlexandco@gmail.com'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Brevo Email Error:', error.response?.data || error.message);
    throw error;
  }
}

const isAuthenticated = (req, res, next) => {
  if (req.session.isAdmin) next();
  else res.status(401).json({ error: 'Unauthorized' });
};

app.get('/api/articles/recent', async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 }).limit(3);
    res.json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/articles', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '9', 10));
    const skip = (page - 1) * limit;

    const category = (req.query.category || '').trim();
    const q = (req.query.q || '').trim();
    const sort = (req.query.sort || '').trim();

    const query = {};
    if (category && category !== 'All' && category !== 'all') query.category = category;

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'popular') sortObj = { views: -1, createdAt: -1 };

    const articles = await Article.find(query).sort(sortObj).skip(skip).limit(limit);
    const total = await Article.countDocuments(query);

    res.json({
      articles,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/articles/search', async (req, res) => {
  try {
    const { q, category, page = 1, limit = 9 } = req.query;
    const currentPage = Math.max(1, parseInt(page, 10));
    const perPage = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * perPage;

    const query = {};

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    if (category && category !== 'All' && category !== 'all') query.category = category;

    const articles = await Article.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage);
    const total = await Article.countDocuments(query);

    res.json({
      articles,
      currentPage,
      totalPages: Math.ceil(total / perPage),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/articles/categories', async (req, res) => {
  try {
    const categories = await Article.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/articles/:slug', async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!article) return res.status(404).json({ error: 'Article not found' });

    const relatedArticles = await Article.find({
      _id: { $ne: article._id },
      category: article.category
    }).sort({ createdAt: -1 }).limit(3);

    res.json({ article, relatedArticles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const subscription = new Newsletter({ email });
    await subscription.save();

    if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) {
      try {
        const brevoResponse = await addToBrevoList(email);
        subscription.brevoId = brevoResponse.id;
        await subscription.save();
      } catch (brevoError) {
        console.error('Brevo subscription error:', brevoError);
      }
    }

    res.json({ success: true, message: 'Subscription successful.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already subscribed.' });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Subscription failed. Please try again.' });
  }
});

app.post('/api/contact/submit', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) {
      try {
        await addToBrevoList(email, name);
      } catch (brevoError) {
        console.error('Brevo contact add error:', brevoError);
      }
    }

    res.json({ success: true, message: 'Message sent successfully. We will get back to you soon.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'maurlex2024';

  if (password === adminPassword) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/admin/check', (req, res) => {
  res.json({ isAuthenticated: !!req.session.isAdmin });
});

app.get('/api/admin/stats', isAuthenticated, async (req, res) => {
  try {
    const articleCount = await Article.countDocuments();
    const contactCount = await Contact.countDocuments({ status: 'new' });
    const newsletterCount = await Newsletter.countDocuments();
    res.json({ articleCount, contactCount, newsletterCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/articles', isAuthenticated, async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/articles/:id', isAuthenticated, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/articles', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { title, excerpt, content, category } = req.body;
    if (!title || !excerpt || !content) return res.status(400).json({ error: 'Missing required fields' });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const article = new Article({
      title,
      slug,
      excerpt,
      content,
      category: category || 'General',
      image: req.file ? req.file.path : '/images/placeholder-article.jpg'
    });

    await article.save();
    res.json({ success: true, message: 'Article created successfully', article });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

app.put('/api/admin/articles/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { title, excerpt, content, category } = req.body;

    const updateData = {
      title,
      excerpt,
      content,
      category,
      updatedAt: Date.now()
    };

    if (req.file) updateData.image = req.file.path;

    const article = await Article.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    res.json({ success: true, message: 'Article updated successfully', article });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

app.delete('/api/admin/articles/:id', isAuthenticated, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

app.get('/api/admin/contacts', isAuthenticated, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ submittedAt: -1 }).limit(50);
    res.json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/newsletter', isAuthenticated, async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 }).limit(100);
    res.json(subscribers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Admin Panel: http://localhost:${port}/admin/login.html`);
});
