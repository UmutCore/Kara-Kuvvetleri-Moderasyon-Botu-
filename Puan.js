const mongoose = require('mongoose');

const puanSchema = new mongoose.Schema({
  userId: String,       // Puan alanın ID'si
  guildId: String,      // Sunucu ID
  puan: { type: Number, default: 0 },
  sonPuanVerme: Date,   // Son puan verme tarihi
  verilenPuanlar: [{
    verenId: String,    // Puan veren
    sebep: String,      // Puan sebebi
    tarih: Date,        // Puan tarihi
    onay: Boolean       // Onay durumu
  }]
});

module.exports = mongoose.model('Puan', puanSchema);
