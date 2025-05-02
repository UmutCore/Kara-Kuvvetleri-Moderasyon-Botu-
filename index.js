const { Client, GatewayIntentBits, ActivityType, Collection } = require('discord.js');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
require('./keep_alive');
dotenv.config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB bağlantısı başarılı'))
  .catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: ['USER', 'CHANNEL']
});

client.commands = new Collection();

// Komutları yükle
const fs = require('fs');
const path = require('path');
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Denetim komutu için değişkenler
const denetimciRoleId = process.env.DENETIMCI_ROLE_ID;
const hedefRolId = process.env.HEDEF_ROL_ID;
const COOLDOWN_TIME = 5 * 60 * 1000;

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} aktif!`);
  client.user.setActivity('Puan Sistemi | Denetim Modu', { type: ActivityType.Watching });
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    // Denetim komutu özel işleme
    if (interaction.commandName === 'denetim') {
      if (!interaction.member.roles.cache.has(denetimciRoleId)) {
        return interaction.reply({
          content: `⛔ Sadece <@&${denetimciRoleId}> rolündeki yetkililer bu komutu kullanabilir!`,
          ephemeral: true
        });
      }

      try {
        await interaction.deferReply({ ephemeral: true });
        const guild = interaction.guild;
        await guild.members.fetch();

        const targetMembers = guild.members.cache.filter(m => 
          m.roles.cache.has(hedefRolId) && !m.user.bot
        );

        if (targetMembers.size === 0) {
          return interaction.editReply('❌ Hedef rolde hiç üye bulunamadı!');
        }

        await interaction.editReply(`📤 ${targetMembers.size} üyeye DM gönderiliyor...`);

        let successCount = 0;
        for (const [_, member] of targetMembers) {
          try {
            const dm = await member.user.createDM();
            await dm.send(
              `🔔 **ŞANLI KARA KUVVETLER KOMUTANLIĞI PERSONELLERİNE,** \n\n` +
              `Merhaba ${member.user.username},\n` +
              `${guild.name} Aktiflik denetiminde iyi bir sonuç elde edebilmemiz için bütün personellerimizi denetim saatinde oyuna bekliyoruz. \n\n` +
              `🌍 Katılmanız gereken oyun: ${process.env.ROBLOX_LINK}\n` +
              `**Yer:** Branş Denetim Alanı\n` +
              `**Saat: 20.00** (19.20'de toplanacağız)\n` +
              `**Tür:** Aktiflik Denetimi\n` +
              `**Ödül:** Gelenlere +1 terfi.\n\n` + 
              `⏰ Acil katılım gereklidir!\n\n` +
              `Saygılarımızla,\n${interaction.user.username}`
            );
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`${member.user.tag} kişisine DM gönderilemedi:`, error.message);
          }
        }

        await interaction.editReply(
          `🎉 **Denetim çağrısı tamamlandı!**\n` +
          `✅ ${successCount}/${targetMembers.size} üyeye ulaşıldı\n` +
          `📌 Hedef Rol: <@&${hedefRolId}>`
        );
      } catch (error) {
        console.error('Denetim hatası:', error);
        await interaction.editReply('❌ Denetim sırasında kritik hata!');
      }
      return;
    }

    // Diğer komutlar
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: '❌ Komut işlenirken bir hata oluştu!', 
        ephemeral: true 
      });
    }
  }

  // Buton etkileşimleri (Puan onayı)
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('puan_onay_')) {
      const onay = interaction.customId === 'puan_onay_evet';
      const originalEmbed = interaction.message.embeds[0];
      const targetUser = originalEmbed.fields.find(f => f.name === 'Puan Alacak').value;
      const puanVeren = originalEmbed.fields.find(f => f.name === 'Puan Veren').value;
      const sebep = originalEmbed.fields.find(f => f.name === 'Sebep').value;

      if (!interaction.member.roles.cache.has(process.env.UST_YONETIM_ROL_ID)) {
        return interaction.reply({ 
          content: '⛔ Sadece üst yönetim onaylayabilir!', 
          ephemeral: true 
        });
      }

      const updatedEmbed = new EmbedBuilder()
        .setColor(onay ? 0x00FF00 : 0xFF0000)
        .setTitle(onay ? 'Puan Onaylandı' : 'Puan Reddedildi')
        .addFields(
          { name: 'Puan Veren', value: puanVeren, inline: true },
          { name: 'Puan Alacak', value: targetUser, inline: true },
          { name: 'Sebep', value: sebep },
          { name: 'Durum', value: onay ? '✅ Onaylandı' : '❌ Reddedildi' },
          { name: 'Onaylayan', value: interaction.user.toString() }
        );

      if (onay) {
        const Puan = require('./models/Puan');
        await Puan.findOneAndUpdate(
          { userId: targetUser.replace(/[<@!>]/g, ''), guildId: interaction.guild.id },
          { 
            $inc: { puan: 1 },
            $push: { 
              verilenPuanlar: { 
                verenId: puanVeren.replace(/[<@!>]/g, ''),
                sebep: sebep,
                tarih: new Date(),
                onay: true
              }
            }
          },
          { upsert: true }
        );
      }

      const logChannel = interaction.guild.channels.cache.get(process.env.LOG_KANAL_ID);
      if (logChannel) {
        await logChannel.send({ embeds: [updatedEmbed] });
      }

      await interaction.update({ 
        embeds: [updatedEmbed], 
        components: [] 
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
