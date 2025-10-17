const express = require('express');
const router = express.Router();
const multer = require('multer');

module.exports = function (db, upload) {
  const handleUpload = (req, res, next) => {
    upload.single('pdf')(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            type: 'error',
            title: 'Upload Failed',
            message: 'File size should not be more than 1MB.',
          });
        }
      }
      next();
    });
  };

  // Submit new experience with PDF stored as blob
  router.post('/submit-experience', handleUpload, async (req, res) => {
    const { name, email, type, year, company, linkedin } = req.body;
    const pdfBuffer = req.file ? req.file.buffer : null;

    if (!name || !email || !type || !year || !company || !pdfBuffer) {
      return res.status(400).json({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please fill in all required fields.',
      });
    }

    try {
      await db.execute(
        `INSERT INTO experiences 
         (name, email, type, year_of_passing, company, linkedin_url, pdf_file) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email, type, year, company, linkedin, pdfBuffer]
      );
      res.status(201).json({
        type: 'success',
        title: 'Submitted',
        message:
          'Experience submitted successfully. It will be reviewed by the admin.',
      });
    } catch (error) {
      res.status(500).json({
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit experience.',
      });
    }
  });

  // Fetch all experiences (without PDF blob for performance)
  router.get('/experiences', async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, email, type, year_of_passing, company, linkedin_url, status, createdAt FROM experiences ORDER BY company'
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({
        type: 'error',
        title: 'Fetch Failed',
        message: 'Failed to fetch experiences.',
      });
    }
  });

  // Retrieve PDF by ID
  router.get('/experiences/:id/pdf', async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await db.execute(
        'SELECT pdf_file FROM experiences WHERE id = ?',
        [id]
      );

      if (rows.length === 0 || !rows[0].pdf_file) {
        return res.status(404).json({
          type: 'warning',
          title: 'Not Found',
          message: 'PDF not found for this experience.',
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="experience_${id}.pdf"`
      );
      res.send(rows[0].pdf_file);
    } catch (error) {
      res.status(500).json({
        type: 'error',
        title: 'Fetch Failed',
        message: 'Failed to fetch PDF.',
      });
    }
  });

  // Pending experiences
  router.get('/admin/pending-experiences', async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, email, type, year_of_passing, company, linkedin_url, status FROM experiences WHERE status = ?',
        ['pending']
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({
        type: 'error',
        title: 'Fetch Failed',
        message: 'Failed to fetch pending experiences.',
      });
    }
  });

  // Approved experiences
  router.get('/admin/approved-experiences', async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, email, type, year_of_passing, company, linkedin_url, status FROM experiences WHERE status = ?',
        ['approved']
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({
        type: 'error',
        title: 'Fetch Failed',
        message: 'Failed to fetch approved experiences.',
      });
    }
  });

  // Update status
  router.post('/admin/update-experience-status', async (req, res) => {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({
        type: 'warning',
        title: 'Invalid Request',
        message: 'Experience ID and status are required.',
      });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        type: 'warning',
        title: 'Invalid Status',
        message: 'Status must be approved or rejected.',
      });
    }

    try {
      await db.execute('UPDATE experiences SET status = ? WHERE id = ?', [
        status,
        id,
      ]);
      res.json({
        type: 'success',
        title: 'Updated',
        message: `Experience ${id} has been ${status}.`,
      });
    } catch (error) {
      res.status(500).json({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update experience status.',
      });
    }
  });

  // Delete experience
  router.delete('/admin/delete-experience/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const [rows] = await db.execute(
        'SELECT id FROM experiences WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({
          type: 'warning',
          title: 'Not Found',
          message: 'Experience not found.',
        });
      }

      await db.execute('DELETE FROM experiences WHERE id = ?', [id]);

      res.json({
        type: 'success',
        title: 'Deleted',
        message: 'Experience deleted successfully.',
      });
    } catch (error) {
      res.status(500).json({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete experience.',
      });
    }
  });

  return router;
};
