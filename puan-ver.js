const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Puan = require('../models/Puan');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('puan-ver')
    .setDescription('Personel puan verme isteği gönderir')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Puan verilecek personel')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Puan verme sebebi')
        .setRequired(true)),
  
  async execute(interaction) {
    // 1. Kanal kontrolü
    if (interaction.channelId !== process.env.PUAN_KANAL_ID) {
      return interaction.reply({
        content: `⛔ Bu komut sadece <#${process.env.PUAN_KANAL_ID}> kanalında kullanılabilir!`,
        ephemeral: true
      });
    }

    // 2. Rol kontrolü
    if (!interaction.member.roles.cache.has(process.env.PUAN_VERME_ROL_ID)) {
      return interaction.reply({ 
        content: '⛔ Puan verme yetkiniz yok!', 
        ephemeral: true 
      });
    }

    const targetUser = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep');

    // 3. Kendine puan vermeyi engelle
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ 
        content: '⛔ Kendinize puan veremezsiniz!', 
        ephemeral: true 
      });
    }

    // 4. Üst yönetim kontrolü
    if (interaction.member.roles.cache.has(process.env.UST_YONETIM_ROL_ID)) {
      return interaction.reply({ 
        content: '⛔ Üst yönetim puan alamaz!', 
        ephemeral: true 
      });
    }

    // 5. Günlük puan kontrolü
    const sonPuan = await Puan.findOne({ 
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      'verilenPuanlar.tarih': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (sonPuan) {
      return interaction.reply({ 
        content: '⛔ 24 saat içinde zaten puan verdiniz!', 
        ephemeral: true 
      });
    }

    // 6. Onay butonları oluştur
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('puan_onay_evet')
          .setLabel('✅ Onayla')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('puan_onay_hayir')
          .setLabel('❌ Reddet')
          .setStyle(ButtonStyle.Danger)
      );

    // 7. Onay isteği gönder
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('Yeni Puan İsteği')
      .addFields(
        { name: 'Puan Veren', value: interaction.user.toString(), inline: true },
        { name: 'Puan Alacak', value: targetUser.toString(), inline: true },
        { name: 'Sebep', value: sebep }
      );

    await interaction.reply({ 
      content: `<@&${process.env.UST_YONETIM_ROL_ID}>`, 
      embeds: [embed], 
      components: [row] 
    });
  }
};
