const { Client, GatewayIntentBits, ActivityType, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
require('./keep_alive');
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: ['USER', 'CHANNEL']
});


const denetimciRoleId = process.env.DENETIMCI_ROLE_ID; // Komutu kullanacak rol
const hedefRolId = process.env.HEDEF_ROL_ID; // DM gidecek üyelerin rolü
const COOLDOWN_TIME = 5 * 60 * 1000; // 5 dakika cooldown

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} aktif!`);
  client.user.setActivity('Özel Denetim Modu', { type: ActivityType.Watching });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  
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
            `🔔 **Resmi Denetim Duyurusu**\n\n` +
            `Merhaba ${member.user.username},\n` +
            `${guild.name} sunucusunda denetim başlamıştır.\n\n` +
            `🌍 Katılmanız gereken oyun: ${process.env.ROBLOX_LINK}\n` +
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
  }
});

client.login(process.env.DISCORD_TOKEN);