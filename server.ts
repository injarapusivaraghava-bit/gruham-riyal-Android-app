import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { db } from './src/db/index.ts';
import fs from 'fs';
import { listings, buyerRequests, favorites, inquiries } from './src/db/schema.ts';
import { eq, and } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure persistent uploads directory exists
const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function startServer() {
  const app = express();
  const portArgIndex = process.argv.indexOf('--port');
  const portFromArgs = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : undefined;
  const PORT = Number(portFromArgs || process.env.PORT || 3000);

  // High capacity for property images, PDFs, and recorded videos
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Serve uploaded media statically
  app.use('/uploads', express.static(uploadsDir));

  // Serve real signed Android APK with strict Android Package Installer MIME headers
  const apkFilePath = path.resolve(__dirname, 'public', 'ManaGruham_RealApp.apk');

  const handleApkDownload = (_req: express.Request, res: express.Response) => {
    if (!fs.existsSync(apkFilePath)) {
      return res.status(404).json({
        error: 'APK file not yet compiled. Please build android-project or download ManaGruham_AndroidProject.zip.',
      });
    }
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="ManaGruham_RealApp.apk"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(apkFilePath);
  };

  app.get('/ManaGruham_RealApp.apk', handleApkDownload);
  app.get('/api/download-apk', handleApkDownload);

  app.get('/api/apk-info', (_req, res) => {
    try {
      if (fs.existsSync(apkFilePath)) {
        const stats = fs.statSync(apkFilePath);
        const mb = (stats.size / (1024 * 1024)).toFixed(2);
        return res.json({
          available: true,
          fileName: 'ManaGruham_RealApp.apk',
          downloadUrl: '/ManaGruham_RealApp.apk',
          packageName: 'com.managruham.realapp',
          versionName: '2.0.0',
          sizeBytes: stats.size,
          sizeFormatted: `${mb} MB`,
          updatedAt: stats.mtime.toISOString(),
        });
      }
      return res.json({
        available: false,
        fileName: 'ManaGruham_RealApp.apk',
        downloadUrl: '/ManaGruham_AndroidProject.zip',
        packageName: 'com.managruham.realapp',
        versionName: '2.0.0',
        sizeBytes: 0,
        sizeFormatted: 'Preparing build...',
      });
    } catch (err: any) {
      return res.status(500).json({ available: false, error: err?.message });
    }
  });

  // Media / Document / Video Upload API
  app.post('/api/upload', async (req, res) => {
    try {
      const { dataUrl, fileName: originalFileName, fileType } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'dataUrl is required' });
      }

      // Extract base64 payload
      const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let extension = 'bin';

      if (matches && matches.length === 3) {
        const mime = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
        if (mime.includes('image/jpeg') || mime.includes('image/jpg')) extension = 'jpg';
        else if (mime.includes('image/png')) extension = 'png';
        else if (mime.includes('image/webp')) extension = 'webp';
        else if (mime.includes('video/mp4')) extension = 'mp4';
        else if (mime.includes('video/webm')) extension = 'webm';
        else if (mime.includes('video/quicktime')) extension = 'mov';
        else if (mime.includes('application/pdf')) extension = 'pdf';
        else extension = mime.split('/')[1] || 'bin';
      } else {
        // Raw base64 string
        buffer = Buffer.from(dataUrl, 'base64');
        extension = fileType || 'bin';
      }

      // Generate a clean, unique file name
      const safePrefix = (originalFileName || 'property-media')
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 30);
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${safePrefix}.${extension}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${uniqueFileName}`;
      console.log(`Uploaded file saved: ${publicUrl} (${(buffer.length / 1024).toFixed(1)} KB)`);

      return res.json({
        success: true,
        url: publicUrl,
        fileName: uniqueFileName,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      return res.status(500).json({ error: 'Failed to process file upload', details: err?.message });
    }
  });

  // Property Inquiries API
  app.post('/api/inquiries', async (req, res) => {
    try {
      const { listingId, listingTitle, ownerUid, senderName, senderPhone, senderEmail, message } = req.body;
      if (!listingId || !senderName || !senderPhone) {
        return res.status(400).json({ error: 'listingId, senderName, and senderPhone are required.' });
      }
      const newInquiry = {
        id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        listingId,
        listingTitle: listingTitle || 'Property',
        ownerUid: ownerUid || '',
        senderName,
        senderPhone,
        senderEmail: senderEmail || '',
        message: message || '',
        createdAt: new Date().toISOString(),
        status: 'new',
      };
      try {
        await db.insert(inquiries).values(newInquiry);
      } catch (dbErr) {
        console.warn('DB inquiry save warning (continuing):', dbErr);
      }
      res.json({ success: true, inquiry: newInquiry });
    } catch (error: any) {
      console.error('Error saving inquiry:', error);
      res.status(500).json({ error: 'Failed to save inquiry.' });
    }
  });

  app.get('/api/inquiries', async (_req, res) => {
    try {
      const allInquiries = await db.select().from(inquiries);
      res.json(allInquiries);
    } catch (error: any) {
      console.warn('Error fetching inquiries from Cloud SQL:', error);
      res.json([]);
    }
  });

  // User synchronization route
  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid || !req.user.email) {
        return res.status(400).json({ error: 'User UID and email are required.' });
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email,
        req.user.name,
        req.user.picture
      );
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error syncing user with Cloud SQL:', error);
      res.status(500).json({ error: 'Failed to synchronize user.' });
    }
  });

  // Listings API
  app.get('/api/listings', async (_req, res) => {
    try {
      const allListings = await db.select().from(listings);
      res.json(allListings);
    } catch (error: any) {
      console.error('Error querying listings from Cloud SQL:', error);
      res.status(500).json({ error: 'Failed to fetch listings.' });
    }
  });

  // Buyer Requests API
  app.get('/api/buyer-requests', async (_req, res) => {
    try {
      const allRequests = await db.select().from(buyerRequests);
      res.json(allRequests);
    } catch (error: any) {
      console.error('Error querying buyer requests from Cloud SQL:', error);
      res.status(500).json({ error: 'Failed to fetch buyer requests.' });
    }
  });

  // User Favorites API
  app.get('/api/favorites', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userFavs = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userUid, req.user.uid));
      res.json(userFavs.map((f) => f.listingId));
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ error: 'Failed to fetch favorites.' });
    }
  });

  app.post('/api/favorites/toggle', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { listingId } = req.body;
      if (!req.user || !listingId) {
        return res.status(400).json({ error: 'Listing ID is required.' });
      }
      const existing = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userUid, req.user.uid),
            eq(favorites.listingId, listingId)
          )
        );

      if (existing.length > 0) {
        await db
          .delete(favorites)
          .where(
            and(
              eq(favorites.userUid, req.user.uid),
              eq(favorites.listingId, listingId)
            )
          );
        res.json({ favorited: false });
      } else {
        await db.insert(favorites).values({
          userUid: req.user.uid,
          listingId,
        });
        res.json({ favorited: true });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      res.status(500).json({ error: 'Failed to toggle favorite.' });
    }
  });

  // Mount Vite middleware in development or serve static in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
