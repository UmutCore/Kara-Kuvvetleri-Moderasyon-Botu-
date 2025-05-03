const { Client, GatewayIntentBits, ActivityType, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: ['USER', 'CHANNEL']
});

// Ayarlar
const denetimciRoleId = process.env.DENETIMCI_ROLE_ID; // Komutu kullanacak rol
const hedefRolId = process.env.HEDEF_ROL_ID; // DM gidecek üyelerin rolü
const COOLDOWN_TIME = 5 * 60 * 1000; // 5 dakika cooldown

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} aktif!`);
  client.user.setActivity('Özel Denetim Modu', { type: ActivityType.Watching });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // DENETİM KOMUTU
  if (interaction.commandName === 'denetim') {
    // 1. Yetki Kontrolü
    if (!interaction.member.roles.cache.has(denetimciRoleId)) {
      return interaction.reply({
        content: `⛔ Sadece <@&${denetimciRoleId}> rolündeki yetkililer bu komutu kullanabilir!`,
        ephemeral: true
      });
    }

    // 2. Denetim Başlatma
    try {
      await interaction.deferReply({ ephemeral: true });
      
      const guild = interaction.guild;
      await guild.members.fetch(); // Tüm üyeleri çek

      // Sadece hedef role sahip üyeleri filtrele
      const targetMembers = guild.members.cache.filter(m => 
        m.roles.cache.has(hedefRolId) && !m.user.bot
      );

      if (targetMembers.size === 0) {
        return interaction.editReply('❌ Hedef rolde hiç üye bulunamadı!');
      }

      await interaction.editReply(`📤 ${targetMembers.size} üyeye DM gönderiliyor...`);

      // DM Gönderme İşlemi
      let successCount = 0;
      for (const [_, member] of targetMembers) {
        try {
          const dm = await member.user.createDM();
          await dm.send(
            
          successCount++;
          
          // Rate Limit koruması (1 saniye bekle)
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`${member.user.tag} kişisine DM gönderilemedi:`, error.message);
        }
      }

      // Sonuç raporu
      await interaction.editReply(
        `🎉 **Denetim tamamlandı!**\n` +
        `✅ ${successCount}/${targetMembers.size} üyeye ulaşıldı\n` +
        `📌 Hedef Rol: <@&${hedefRolId}>`
      );

    } catch (error) {
      console.error('Denetim hatası:', error);
      await interaction.editReply('❌ Denetim sırasında kritik hata!');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
