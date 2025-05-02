const { SlashCommandBuilder } = require('discord.js');
const Puan = require('../models/Puan');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('puan-sıfırla')
    .setDescription('Tüm puanları sıfırlar (Sadece admin)'),
  
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.ADMIN_ROL_ID)) {
      return interaction.reply({ 
        content: '⛔ Bu komut sadece yöneticilere özeldir!', 
        ephemeral: true 
      });
    }

    await Puan.deleteMany({ guildId: interaction.guild.id });
    await interaction.reply('✅ Tüm puanlar sıfırlandı!');
  }
};
