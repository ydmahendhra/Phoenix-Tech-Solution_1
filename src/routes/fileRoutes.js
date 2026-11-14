const express = require('express');
const router = express.Router();
const { downloadFromGridFS } = require('../services/fileService');

router.get('/:id', async (req, res) => {
  await downloadFromGridFS(req.params.id, res);
});

module.exports = router;
