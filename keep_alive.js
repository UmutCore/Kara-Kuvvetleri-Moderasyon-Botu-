
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot aktif! (Ping başarılı.)');
});

app.listen(3000, () => {
  console.log('✅ Keep-alive server çalışıyor (3000 portunda)!');
});
