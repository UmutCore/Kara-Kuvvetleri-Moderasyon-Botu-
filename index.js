require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`✅ ${process.env.BRANS_ADI} Denetim Botu Aktif!`);
  client.user.setActivity(`${process.env.BRANS_ADI} Denetimleri`, { type: ActivityType.Watching });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'denetim') {
    // Yetki kontrolü
    if (!interaction.member.roles.cache.has(process.env.DENETIMCI_ROLE_ID)) {
      return interaction.reply({
        content: `⛔ Sadece <@&${process.env.DENETIMCI_ROLE_ID}> rolündekiler kullanabilir!`,
        ephemeral: true
      });
    }

    // Denetim işlemleri
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    
    try {
      const members = await guild.members.fetch();
      const targets = members.filter(m => 
        m.roles.cache.has(process.env.HEDEF_ROL_ID) && !m.user.bot
      );

      // DM gönderme döngüsü
      let success = 0;
      for (const [_, member] of targets) {
        try {
          await member.send(
            `🔔 **${process.env.BRANS_ADI} Denetim Çağrısı**\n` +
            `Lütfen oyuna katılın: ${process.env.ROBLOX_LINK}\n` +
            `**Sorumlu:** ${interaction.user.tag}`
          );
          success++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit koruma
        } catch (err) {
          console.error(`${member.user.tag} DM gönderilemedi:`, err.message);
        }
      }

      await interaction.editReply(`✅ ${success}/${targets.size} üyeye ulaşıldı!`);
    } catch (error) {
      console.error('Denetim hatası:', error);
      await interaction.editReply('❌ Denetim sırasında hata oluştu!');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
