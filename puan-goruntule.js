const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Puan = require('../models/Puan');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('puan-görüntüle')
    .setDescription('Personel puanlarını listeler'),
  
  async execute(interaction) {
    const puanlar = await Puan.find({ 
      guildId: interaction.guild.id 
    }).sort({ puan: -1 });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Personel Puan Tablosu')
      .setColor(0x3498db);

    puanlar.forEach(puan => {
      embed.addFields({
        name: `<@${puan.userId}>`,
        value: `**${puan.puan} puan**`,
        inline: true
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
